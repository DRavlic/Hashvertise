export interface TwitterApiResponse {
  tweets?: Tweet[];
  has_next_page?: boolean;
  next_cursor?: string;
  status?: string;
  message?: string;
  error?: number;
}

export interface Tweet {
  type: string;
  id: string;
  url: string;
  text: string;
  source: string;
  retweetCount: number;
  replyCount: number;
  likeCount: number;
  quoteCount: number;
  viewCount: number;
  createdAt: string;
  lang: string;
  bookmarkCount: number;
  isReply: boolean;
  inReplyToId?: string;
  conversationId?: string;
  inReplyToUserId?: string;
  inReplyToUsername?: string;
  author: Author;
  entities?: Entities;
  quoted_tweet?: any;
  retweeted_tweet?: any;
}

export interface Author {
  type: string;
  userName: string;
  url: string;
  id: string;
  name: string;
  isBlueVerified: boolean;
  profilePicture: string;
  // TO DO: see if you need to add more fields
}

export interface Entities {
  hashtags?: Hashtag[];
  urls?: Url[];
  user_mentions?: UserMention[];
}

export interface Hashtag {
  indices: number[];
  text: string;
}

export interface Url {
  display_url: string;
  expanded_url: string;
  indices: number[];
  url: string;
}

export interface UserMention {
  id_str: string;
  name: string;
  screen_name: string;
}
