export interface WatchVideo {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  thumbnail_url?: string | null;
  video_url: string;
  youtube_video_id: string;
  category: string;
  source_name?: string | null;
  published_at?: string | null;
  is_featured: boolean;
}

export interface PaginatedWatchVideos {
  data: WatchVideo[];
  links?: {
    first?: string;
    last?: string;
    prev?: string | null;
    next?: string | null;
  };
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
}
