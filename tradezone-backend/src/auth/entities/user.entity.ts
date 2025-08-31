export class User {
  id: string;
  name: string;
  email: string;
  password: string;
  isAiFeatureEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
