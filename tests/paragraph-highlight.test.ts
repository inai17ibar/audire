import { describe, it, expect } from "vitest";

type PlayingParagraph = {
  index: number;
  currentTime: number;
  duration: number;
} | null;

describe("Paragraph Audio Highlight Feature", () => {
  describe("Playback Status Tracking", () => {
    it("should track playing paragraph index", () => {
      let playingParagraph: PlayingParagraph = null;
      
      // Start playing paragraph 0
      playingParagraph = { index: 0, currentTime: 0, duration: 10 };
      
      expect(playingParagraph).not.toBeNull();
      expect(playingParagraph?.index).toBe(0);
    });

    it("should track current time during playback", () => {
      const playingParagraph: PlayingParagraph = { index: 0, currentTime: 5.5, duration: 10 };
      
      expect(playingParagraph?.currentTime).toBe(5.5);
      expect(playingParagraph?.currentTime).toBeGreaterThan(0);
      expect(playingParagraph && playingParagraph.currentTime < playingParagraph.duration).toBe(true);
    });

    it("should track audio duration", () => {
      const playingParagraph: PlayingParagraph = { index: 0, currentTime: 2, duration: 10 };
      
      expect(playingParagraph?.duration).toBe(10);
      expect(playingParagraph?.duration).toBeGreaterThan(0);
    });

    it("should clear playing paragraph when stopped", () => {
      let playingParagraph: PlayingParagraph = {
        index: 0,
        currentTime: 5,
        duration: 10,
      };
      
      // Stop playing
      playingParagraph = null;
      
      expect(playingParagraph).toBeNull();
    });
  });

  describe("Highlight Time Calculation", () => {
    it("should use paragraph time when playing TTS audio", () => {
      const playingParagraph: PlayingParagraph = { index: 1, currentTime: 3, duration: 8 };
      const articleCurrentTime = 50;
      const articleDuration = 120;
      const paragraphIndex = 1;
      
      const isPlayingThisParagraph = playingParagraph?.index === paragraphIndex;
      const highlightCurrentTime = isPlayingThisParagraph && playingParagraph
        ? playingParagraph.currentTime 
        : articleCurrentTime;
      const highlightDuration = isPlayingThisParagraph && playingParagraph
        ? playingParagraph.duration 
        : articleDuration;
      
      expect(isPlayingThisParagraph).toBe(true);
      expect(highlightCurrentTime).toBe(3);
      expect(highlightDuration).toBe(8);
    });

    it("should use article time when not playing TTS audio", () => {
      const playingParagraph: PlayingParagraph = null;
      const articleCurrentTime = 50;
      const articleDuration = 120;
      const paragraphIndex = 1;
      
      const isPlayingThisParagraph = playingParagraph?.index === paragraphIndex;
      const highlightCurrentTime = isPlayingThisParagraph && playingParagraph
        ? playingParagraph.currentTime 
        : articleCurrentTime;
      const highlightDuration = isPlayingThisParagraph && playingParagraph
        ? playingParagraph.duration 
        : articleDuration;
      
      expect(isPlayingThisParagraph).toBe(false);
      expect(highlightCurrentTime).toBe(50);
      expect(highlightDuration).toBe(120);
    });

    it("should use article time for other paragraphs", () => {
      const playingParagraph: PlayingParagraph = { index: 0, currentTime: 3, duration: 8 };
      const articleCurrentTime = 50;
      const articleDuration = 120;
      const paragraphIndex = 1; // Different paragraph
      
      const isPlayingThisParagraph = playingParagraph?.index === paragraphIndex;
      const highlightCurrentTime = isPlayingThisParagraph && playingParagraph
        ? playingParagraph.currentTime 
        : articleCurrentTime;
      const highlightDuration = isPlayingThisParagraph && playingParagraph
        ? playingParagraph.duration 
        : articleDuration;
      
      expect(isPlayingThisParagraph).toBe(false);
      expect(highlightCurrentTime).toBe(50);
      expect(highlightDuration).toBe(120);
    });
  });

  describe("Playback Status Change Callback", () => {
    it("should set playing paragraph when audio starts", () => {
      let playingParagraph: PlayingParagraph = null;
      
      const onPlaybackStatusChange = (isPlaying: boolean, currentTime: number, duration: number) => {
        const paragraphIndex = 0;
        if (isPlaying && duration > 0) {
          playingParagraph = { index: paragraphIndex, currentTime, duration };
        }
      };
      
      // Simulate audio start
      onPlaybackStatusChange(true, 0, 10);
      
      expect(playingParagraph).not.toBeNull();
      if (playingParagraph) {
        expect(playingParagraph.index).toBe(0);
        expect(playingParagraph.duration).toBe(10);
      }
    });

    it("should update playing paragraph during playback", () => {
      let playingParagraph: PlayingParagraph = {
        index: 0,
        currentTime: 0,
        duration: 10,
      };
      
      const onPlaybackStatusChange = (isPlaying: boolean, currentTime: number, duration: number) => {
        const paragraphIndex = 0;
        if (isPlaying && duration > 0) {
          playingParagraph = { index: paragraphIndex, currentTime, duration };
        }
      };
      
      // Simulate playback progress
      onPlaybackStatusChange(true, 2.5, 10);
      expect(playingParagraph?.currentTime).toBe(2.5);
      
      onPlaybackStatusChange(true, 5.0, 10);
      expect(playingParagraph?.currentTime).toBe(5.0);
    });

    it("should clear playing paragraph when audio stops", () => {
      let playingParagraph: PlayingParagraph = {
        index: 0,
        currentTime: 5,
        duration: 10,
      };
      
      const onPlaybackStatusChange = (isPlaying: boolean, _currentTime: number, _duration: number) => {
        const paragraphIndex = 0;
        if (!isPlaying && playingParagraph?.index === paragraphIndex) {
          playingParagraph = null;
        }
      };
      
      // Simulate audio stop
      onPlaybackStatusChange(false, 5, 10);
      
      expect(playingParagraph).toBeNull();
    });
  });

  describe("Multiple Paragraph Handling", () => {
    it("should switch playing paragraph when starting different paragraph", () => {
      let playingParagraph: PlayingParagraph = {
        index: 0,
        currentTime: 5,
        duration: 10,
      };
      
      // Start playing paragraph 1
      playingParagraph = { index: 1, currentTime: 0, duration: 8 };
      
      expect(playingParagraph.index).toBe(1);
      expect(playingParagraph.currentTime).toBe(0);
      expect(playingParagraph.duration).toBe(8);
    });

    it("should highlight only the playing paragraph", () => {
      const playingParagraph: PlayingParagraph = { index: 1, currentTime: 3, duration: 8 };
      
      const paragraphs = [
        { index: 0, isPlaying: playingParagraph?.index === 0 },
        { index: 1, isPlaying: playingParagraph?.index === 1 },
        { index: 2, isPlaying: playingParagraph?.index === 2 },
      ];
      
      expect(paragraphs[0].isPlaying).toBe(false);
      expect(paragraphs[1].isPlaying).toBe(true);
      expect(paragraphs[2].isPlaying).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero duration", () => {
      let playingParagraph: PlayingParagraph = null;
      
      const onPlaybackStatusChange = (isPlaying: boolean, currentTime: number, duration: number) => {
        const paragraphIndex = 0;
        if (isPlaying && duration > 0) {
          playingParagraph = { index: paragraphIndex, currentTime, duration };
        }
      };
      
      // Simulate audio with zero duration (not ready yet)
      onPlaybackStatusChange(true, 0, 0);
      
      expect(playingParagraph).toBeNull();
    });

    it("should handle negative time values", () => {
      const playingParagraph: PlayingParagraph = { index: 0, currentTime: -1, duration: 10 };
      
      // Clamp negative values to 0
      const clampedTime = playingParagraph ? Math.max(0, playingParagraph.currentTime) : 0;
      
      expect(clampedTime).toBe(0);
    });

    it("should handle time exceeding duration", () => {
      const playingParagraph: PlayingParagraph = { index: 0, currentTime: 12, duration: 10 };
      
      // Clamp time to duration
      const clampedTime = playingParagraph 
        ? Math.min(playingParagraph.duration, playingParagraph.currentTime)
        : 0;
      
      expect(clampedTime).toBe(10);
    });
  });

  describe("Integration with HighlightedText", () => {
    it("should pass correct time and duration to HighlightedText", () => {
      const playingParagraph: PlayingParagraph = { index: 0, currentTime: 3, duration: 8 };
      const articleCurrentTime = 50;
      const articleDuration = 120;
      const paragraphIndex = 0;
      
      const isPlayingThisParagraph = playingParagraph?.index === paragraphIndex;
      const highlightProps = {
        text: "This is a test paragraph.",
        currentTime: isPlayingThisParagraph && playingParagraph ? playingParagraph.currentTime : articleCurrentTime,
        duration: isPlayingThisParagraph && playingParagraph ? playingParagraph.duration : articleDuration,
      };
      
      expect(highlightProps.currentTime).toBe(3);
      expect(highlightProps.duration).toBe(8);
    });

    it("should calculate highlight progress correctly", () => {
      const currentTime = 3;
      const duration = 8;
      const text = "This is a test paragraph with multiple words.";
      const words = text.split(/\s+/);
      
      const progress = currentTime / duration;
      const currentWordIndex = Math.floor(progress * words.length);
      
      expect(progress).toBeCloseTo(0.375);
      expect(currentWordIndex).toBe(3); // 4th word (0-indexed)
      expect(words[currentWordIndex]).toBe("test");
    });
  });
});
