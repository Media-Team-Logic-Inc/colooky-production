import { Octokit } from '@octokit/rest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface GitHubFile {
  name: string;
  path: string;
  content: string;
  type: 'file' | 'dir';
  size: number;
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  default_branch: string;
  language: string;
  size: number;
  updated_at: string;
  description: string | null;
}

export class GitHubService {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    });
  }

  async getUserRepositories(page = 1, per_page = 30): Promise<Repository[]> {
    try {
      const response = await this.octokit.repos.listForAuthenticatedUser({
        page,
        per_page,
        sort: 'updated',
        direction: 'desc',
      });

      return response.data.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        html_url: repo.html_url,
        default_branch: repo.default_branch || 'main',
        language: repo.language || 'Unknown',
        size: repo.size,
        updated_at: repo.updated_at || new Date().toISOString(),
        description: repo.description,
      }));
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw new Error('Failed to fetch repositories');
    }
  }

  async getRepositoryContents(
    owner: string,
    repo: string,
    path = '',
    recursive = false
  ): Promise<GitHubFile[]> {
    try {
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      const contents = Array.isArray(response.data) ? response.data : [response.data];
      const files: GitHubFile[] = [];

      for (const item of contents) {
        if (item.type === 'file') {
          const fileContent = await this.getFileContent(owner, repo, item.path);
          files.push({
            name: item.name,
            path: item.path,
            content: fileContent,
            type: 'file',
            size: item.size,
          });
        } else if (item.type === 'dir' && recursive) {
          const dirFiles = await this.getRepositoryContents(owner, repo, item.path, true);
          files.push(...dirFiles);
        } else if (item.type === 'dir') {
          files.push({
            name: item.name,
            path: item.path,
            content: '',
            type: 'dir',
            size: 0,
          });
        }
      }

      return files;
    } catch (error) {
      console.error('Error fetching repository contents:', error);
      throw new Error('Failed to fetch repository contents');
    }
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    try {
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      if (Array.isArray(response.data) || response.data.type !== 'file') {
        throw new Error('Path does not point to a file');
      }

      // Decode base64 content
      return Buffer.from(response.data.content, 'base64').toString('utf-8');
    } catch (error) {
      console.error('Error fetching file content:', error);
      throw new Error('Failed to fetch file content');
    }
  }

  async getCodeFiles(owner: string, repo: string): Promise<GitHubFile[]> {
    const codeExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs',
      '.php', '.rb', '.go', '.rs', '.kt', '.swift', '.scala', '.sh',
      '.vue', '.svelte', '.html', '.css', '.scss', '.less', '.json',
      '.yaml', '.yml', '.xml', '.md', '.sql'
    ];

    try {
      const allFiles = await this.getRepositoryContents(owner, repo, '', true);
      
      return allFiles.filter(file => 
        file.type === 'file' && 
        codeExtensions.some(ext => file.name.toLowerCase().endsWith(ext)) &&
        !file.path.includes('node_modules') &&
        !file.path.includes('.git') &&
        !file.path.includes('dist') &&
        !file.path.includes('build') &&
        file.size < 1000000 // Skip files larger than 1MB
      );
    } catch (error) {
      console.error('Error filtering code files:', error);
      throw new Error('Failed to get code files');
    }
  }

  async validateRepositoryAccess(owner: string, repo: string): Promise<boolean> {
    try {
      await this.octokit.repos.get({ owner, repo });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getUserInfo() {
    try {
      const response = await this.octokit.users.getAuthenticated();
      return {
        id: response.data.id,
        login: response.data.login,
        name: response.data.name,
        email: response.data.email,
        avatar_url: response.data.avatar_url,
      };
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw new Error('Failed to fetch user information');
    }
  }

  static async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    user: any;
  }> {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const tokenData: any = await tokenResponse.json();
      
      if (tokenData.error) {
        throw new Error(`GitHub OAuth error: ${tokenData.error_description}`);
      }

      const accessToken = tokenData.access_token;

      // Get user information
      const githubService = new GitHubService(accessToken);
      const user = await githubService.getUserInfo();

      return {
        accessToken,
        user,
      };
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw new Error('Failed to exchange authorization code');
    }
  }

  async saveRepositoryAnalysis(
    repositoryId: string,
    commitSha: string,
    analysisData: any,
    branch: string = 'main'
  ) {
    try {
      return await prisma.analysisResult.upsert({
        where: {
          repositoryId_commitSha_branch: {
            repositoryId,
            commitSha,
            branch,
          },
        },
        update: {
          analysisData,
          updatedAt: new Date(),
        },
        create: {
          repositoryId,
          commitSha,
          branch,
          analysisData,
        },
      });
    } catch (error) {
      console.error('Error saving repository analysis:', error);
      throw new Error('Failed to save repository analysis');
    }
  }

  async getRepositoryAnalysis(repositoryId: string, commitSha: string, branch: string = 'main') {
    try {
      return await prisma.analysisResult.findUnique({
        where: {
          repositoryId_commitSha_branch: {
            repositoryId,
            commitSha,
            branch,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching repository analysis:', error);
      throw new Error('Failed to fetch repository analysis');
    }
  }
}