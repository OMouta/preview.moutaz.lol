export interface LinkMetadata {
  title: string;
  description: string;
  image: string;
  favicon: string;
  domain: string;
  url: string;
}

export interface FetchState {
  loading: boolean;
  error: string | null;
  data: LinkMetadata | null;
}

export type PreviewStyle = 'default' | 'instagram' | 'discord';