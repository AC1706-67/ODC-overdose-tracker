export interface EASBuild {
  id: string;
  status: 'NEW' | 'IN_QUEUE' | 'IN_PROGRESS' | 'FINISHED' | 'ERRORED' | 'CANCELED';
  createdAt: string;
  artifacts?: {
    buildUrl?: string;
  };
  platform: 'ANDROID' | 'IOS';
  distribution: 'STORE' | 'INTERNAL' | 'SIMULATOR';
}

export interface GraphQLResponse<T = any> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: string[];
  }>;
}

export interface BuildsResponse {
  app: {
    byId: {
      builds: EASBuild[];
    };
  };
}

export interface AppConfig {
  expo: {
    name: string;
    version: string;
    slug: string;
    extra: {
      eas: {
        projectId: string;
      };
    };
  };
}

export interface ShareUrlResult {
  url: string;
  type: 'direct' | 'page';
}