import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const TTSContext = createContext(null);

export const TTSProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentArticle, setCurrentArticle] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [voices, setVoices] = useState([]);
  const [progress, setProgress] = useState(0);
  const utteranceRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Select default English voice
      const defaultVoice = availableVoices.find(v => v.lang.startsWith('en') && v.default) || availableVoices[0];
      setSelectedVoice(defaultVoice);
      
      // Load saved preferences
      const savedRate = localStorage.getItem('tts_rate');
      if (savedRate) setPlaybackRate(parseFloat(savedRate));
      
      const savedVoiceURI = localStorage.getItem('tts_voice');
      if (savedVoiceURI) {
        const voice = availableVoices.find(v => v.voiceURI === savedVoiceURI);
        if (voice) setSelectedVoice(voice);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const speak = (article) => {
    if (!article?.summary?.executive_summary) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const text = `${article.title}. ${article.summary.executive_summary}`;
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.rate = playbackRate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentArticle(article);
      setProgress(0);
      
      // Track progress
      const textLength = text.length;
      intervalRef.current = setInterval(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          setProgress(prev => Math.min(prev + (100 / (textLength * 0.1)), 100));
        }
      }, 100);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    utterance.onerror = (e) => {
      console.error('TTS error:', e);
      setIsPlaying(false);
      setIsPaused(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const pause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resume = () => {
    window.speechSynthesis.resume();
    setIsPaused(false);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentArticle(null);
    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const changeRate = (rate) => {
    setPlaybackRate(rate);
    localStorage.setItem('tts_rate', rate.toString());
    
    // If currently playing, restart with new rate
    if (isPlaying && currentArticle) {
      speak(currentArticle);
    }
  };

  const changeVoice = (voice) => {
    setSelectedVoice(voice);
    localStorage.setItem('tts_voice', voice.voiceURI);
    
    // If currently playing, restart with new voice
    if (isPlaying && currentArticle) {
      speak(currentArticle);
    }
  };

  return (
    <TTSContext.Provider
      value={{
        isPlaying,
        isPaused,
        currentArticle,
        playbackRate,
        selectedVoice,
        voices,
        progress,
        speak,
        pause,
        resume,
        stop,
        changeRate,
        changeVoice,
      }}
    >
      {children}
    </TTSContext.Provider>
  );
};

export const useTTS = () => {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error('useTTS must be used within TTSProvider');
  }
  return context;
};
