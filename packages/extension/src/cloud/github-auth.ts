import * as vscode from 'vscode'

export interface GitHubIdentity {
  id: string
  username: string
  avatarUrl: string
}

/**
 * Wraps VS Code's built-in GitHub authentication provider.
 * Auth is triggered only when the user enables cloud sync.
 */
export class GitHubAuth implements vscode.Disposable {
  private session: vscode.AuthenticationSession | null = null
  private identity: GitHubIdentity | null = null
  private readonly disposables: vscode.Disposable[] = []

  private readonly _onDidChangeAuth = new vscode.EventEmitter<GitHubIdentity | null>()
  readonly onDidChangeAuth = this._onDidChangeAuth.event

  constructor() {
    this.disposables.push(
      vscode.authentication.onDidChangeSessions((e) => {
        if (e.provider.id === 'github') {
          this.session = null
          this.identity = null
          this._onDidChangeAuth.fire(null)
        }
      }),
      this._onDidChangeAuth,
    )
  }

  /** Prompt user to sign in with GitHub. Returns null if declined. */
  async signIn(): Promise<GitHubIdentity | null> {
    try {
      this.session = await vscode.authentication.getSession('github', ['read:user'], {
        createIfNone: true,
      })
    } catch {
      // User cancelled the auth prompt
      return null
    }

    this.identity = {
      id: this.session.account.id,
      username: this.session.account.label,
      avatarUrl: `https://avatars.githubusercontent.com/u/${this.session.account.id}`,
    }

    this._onDidChangeAuth.fire(this.identity)
    return this.identity
  }

  /** Try to restore an existing session without prompting. */
  async tryRestore(): Promise<GitHubIdentity | null> {
    try {
      const session = await vscode.authentication.getSession('github', ['read:user'], {
        createIfNone: false,
      })
      if (!session) return null
      this.session = session
    } catch {
      return null
    }

    this.identity = {
      id: this.session.account.id,
      username: this.session.account.label,
      avatarUrl: `https://avatars.githubusercontent.com/u/${this.session.account.id}`,
    }

    return this.identity
  }

  signOut(): void {
    this.session = null
    this.identity = null
    this._onDidChangeAuth.fire(null)
  }

  getToken(): string | null {
    return this.session?.accessToken ?? null
  }

  getIdentity(): GitHubIdentity | null {
    return this.identity
  }

  isAuthenticated(): boolean {
    return this.session !== null
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose())
  }
}
