import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Audio post type
export interface AudioPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  audioUri: string;
  duration: number; // in seconds
  caption?: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  isStory: boolean; // 24-hour story
  expiresAt?: number; // timestamp for stories
  soundEffect?: string; // applied sound effect
  bgmTrack?: string; // background music
  createdAt: number;
}

// Sound effect type
export interface SoundEffect {
  id: string;
  name: string;
  icon: string;
  audioUri: string;
}

// BGM track type
export interface BGMTrack {
  id: string;
  name: string;
  artist: string;
  audioUri: string;
  duration: number;
}

// Live room type
export interface LiveRoom {
  id: string;
  hostId: string;
  hostName: string;
  title: string;
  listeners: number;
  speakers: string[];
  isLive: boolean;
  createdAt: number;
}

// Audio context state
interface AudioContextState {
  posts: AudioPost[];
  stories: AudioPost[];
  liveRooms: LiveRoom[];
  soundEffects: SoundEffect[];
  bgmTracks: BGMTrack[];
  isLoading: boolean;
  // Actions
  addPost: (post: Omit<AudioPost, "id" | "likes" | "comments" | "isLiked" | "createdAt">) => Promise<AudioPost>;
  deletePost: (postId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  refreshPosts: () => Promise<void>;
  createLiveRoom: (title: string, hostId: string, hostName: string) => Promise<LiveRoom>;
  joinLiveRoom: (roomId: string) => Promise<void>;
  leaveLiveRoom: (roomId: string) => Promise<void>;
}

const AudioContext = createContext<AudioContextState | undefined>(undefined);

const POSTS_STORAGE_KEY = "@audire_posts";

// Mock sound effects
const MOCK_SOUND_EFFECTS: SoundEffect[] = [
  { id: "applause", name: "拍手", icon: "👏", audioUri: "" },
  { id: "laugh", name: "笑い声", icon: "😂", audioUri: "" },
  { id: "wow", name: "驚き", icon: "😮", audioUri: "" },
  { id: "bell", name: "ベル", icon: "🔔", audioUri: "" },
  { id: "sparkle", name: "キラキラ", icon: "✨", audioUri: "" },
];

// Mock BGM tracks
const MOCK_BGM_TRACKS: BGMTrack[] = [
  { id: "calm", name: "穏やかな朝", artist: "Audire Music", audioUri: "", duration: 180 },
  { id: "upbeat", name: "元気な一日", artist: "Audire Music", audioUri: "", duration: 150 },
  { id: "night", name: "静かな夜", artist: "Audire Music", audioUri: "", duration: 200 },
  { id: "nature", name: "自然の音", artist: "Audire Music", audioUri: "", duration: 240 },
];

// Mock posts for demo
const MOCK_POSTS: AudioPost[] = [
  {
    id: "1",
    userId: "demo1",
    userName: "田中太郎",
    audioUri: "",
    duration: 45,
    caption: "今日の朝の散歩で聞いた鳥の声です。とても癒されました。",
    likes: 24,
    comments: 5,
    isLiked: false,
    isStory: false,
    createdAt: Date.now() - 3600000,
  },
  {
    id: "2",
    userId: "demo2",
    userName: "佐藤花子",
    audioUri: "",
    duration: 30,
    caption: "お気に入りのカフェで録音しました。",
    likes: 18,
    comments: 3,
    isLiked: true,
    isStory: false,
    createdAt: Date.now() - 7200000,
  },
  {
    id: "3",
    userId: "demo3",
    userName: "山田一郎",
    audioUri: "",
    duration: 60,
    caption: "ピアノの練習記録です。",
    likes: 42,
    comments: 8,
    isLiked: false,
    isStory: false,
    createdAt: Date.now() - 10800000,
  },
];

// Mock stories
const MOCK_STORIES: AudioPost[] = [
  {
    id: "s1",
    userId: "demo1",
    userName: "田中太郎",
    audioUri: "",
    duration: 15,
    caption: "おはようございます！",
    likes: 0,
    comments: 0,
    isLiked: false,
    isStory: true,
    expiresAt: Date.now() + 86400000,
    createdAt: Date.now() - 1800000,
  },
  {
    id: "s2",
    userId: "demo2",
    userName: "佐藤花子",
    audioUri: "",
    duration: 20,
    caption: "今日のランチ",
    likes: 0,
    comments: 0,
    isLiked: false,
    isStory: true,
    expiresAt: Date.now() + 72000000,
    createdAt: Date.now() - 3600000,
  },
];

// Mock live rooms
const MOCK_LIVE_ROOMS: LiveRoom[] = [
  {
    id: "live1",
    hostId: "demo1",
    hostName: "田中太郎",
    title: "朝の雑談ルーム",
    listeners: 15,
    speakers: ["demo1"],
    isLive: true,
    createdAt: Date.now() - 1800000,
  },
  {
    id: "live2",
    hostId: "demo3",
    hostName: "山田一郎",
    title: "音楽について語ろう",
    listeners: 28,
    speakers: ["demo3", "demo2"],
    isLive: true,
    createdAt: Date.now() - 3600000,
  },
];

export function AudioProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<AudioPost[]>(MOCK_POSTS);
  const [stories, setStories] = useState<AudioPost[]>(MOCK_STORIES);
  const [liveRooms, setLiveRooms] = useState<LiveRoom[]>(MOCK_LIVE_ROOMS);
  const [isLoading, setIsLoading] = useState(false);

  // Load posts from storage
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const stored = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setPosts([...parsed, ...MOCK_POSTS]);
        }
      } catch (error) {
        console.error("Failed to load posts:", error);
      }
    };
    loadPosts();
  }, []);

  // Save posts to storage
  const savePosts = useCallback(async (newPosts: AudioPost[]) => {
    try {
      // Only save user-created posts, not mock data
      const userPosts = newPosts.filter(p => !p.id.startsWith("demo") && !p.id.match(/^[0-9]$/));
      await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(userPosts));
    } catch (error) {
      console.error("Failed to save posts:", error);
    }
  }, []);

  // Add new post
  const addPost = useCallback(async (postData: Omit<AudioPost, "id" | "likes" | "comments" | "isLiked" | "createdAt">): Promise<AudioPost> => {
    const newPost: AudioPost = {
      ...postData,
      id: `post_${Date.now()}`,
      likes: 0,
      comments: 0,
      isLiked: false,
      createdAt: Date.now(),
    };

    if (postData.isStory) {
      newPost.expiresAt = Date.now() + 86400000; // 24 hours
      setStories(prev => [newPost, ...prev]);
    } else {
      setPosts(prev => {
        const updated = [newPost, ...prev];
        savePosts(updated);
        return updated;
      });
    }

    return newPost;
  }, [savePosts]);

  // Delete post
  const deletePost = useCallback(async (postId: string) => {
    setPosts(prev => {
      const updated = prev.filter(p => p.id !== postId);
      savePosts(updated);
      return updated;
    });
    setStories(prev => prev.filter(p => p.id !== postId));
  }, [savePosts]);

  // Toggle like
  const toggleLike = useCallback(async (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likes: p.isLiked ? p.likes - 1 : p.likes + 1,
        };
      }
      return p;
    }));
  }, []);

  // Refresh posts
  const refreshPosts = useCallback(async () => {
    setIsLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  }, []);

  // Create live room
  const createLiveRoom = useCallback(async (title: string, hostId: string, hostName: string): Promise<LiveRoom> => {
    const newRoom: LiveRoom = {
      id: `room_${Date.now()}`,
      hostId,
      hostName,
      title,
      listeners: 1,
      speakers: [hostId],
      isLive: true,
      createdAt: Date.now(),
    };
    setLiveRooms(prev => [newRoom, ...prev]);
    return newRoom;
  }, []);

  // Join live room
  const joinLiveRoom = useCallback(async (roomId: string) => {
    setLiveRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        return { ...room, listeners: room.listeners + 1 };
      }
      return room;
    }));
  }, []);

  // Leave live room
  const leaveLiveRoom = useCallback(async (roomId: string) => {
    setLiveRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        return { ...room, listeners: Math.max(0, room.listeners - 1) };
      }
      return room;
    }));
  }, []);

  return (
    <AudioContext.Provider
      value={{
        posts,
        stories,
        liveRooms,
        soundEffects: MOCK_SOUND_EFFECTS,
        bgmTracks: MOCK_BGM_TRACKS,
        isLoading,
        addPost,
        deletePost,
        toggleLike,
        refreshPosts,
        createLiveRoom,
        joinLiveRoom,
        leaveLiveRoom,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
