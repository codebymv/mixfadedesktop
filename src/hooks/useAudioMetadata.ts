import { useCallback } from 'react';

export interface AudioMetadata {
  sampleRate: number;
  channels: number;
  bitDepth: string;
  format: string;
  duration: number;
}

export const useAudioMetadata = () => {
  // Extract audio metadata - memoized with file name and size only
  const extractAudioMetadata = useCallback(async (audioBuffer: AudioBuffer, file: File): Promise<AudioMetadata> => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const fileSizeBytes = file.size;
    
    // Estimate bit depth based on file type and size
    const estimateBitDepth = () => {
      const durationSeconds = audioBuffer.duration;
      const channels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      
      // Calculate approximate bit depth from file size
      const totalSamples = durationSeconds * sampleRate * channels;
      const bitsPerSample = (fileSizeBytes * 8) / totalSamples;
      
      if (fileExtension === 'mp3' || fileExtension === 'aac' || fileExtension === 'm4a') {
        // For compressed formats, estimate bitrate instead
        const bitrate = Math.round((fileSizeBytes * 8) / durationSeconds / 1000);
        return `${bitrate}kbps`;
      } else if (bitsPerSample > 20) {
        return '24-bit';
      } else if (bitsPerSample > 12) {
        return '16-bit';
      } else {
        return '8-bit';
      }
    };

    // Determine format
    const getFormat = () => {
      switch (fileExtension) {
        case 'wav': return 'WAV';
        case 'mp3': return 'MP3';
        case 'flac': return 'FLAC';
        case 'aiff':
        case 'aif': return 'AIFF';
        case 'ogg': return 'OGG';
        case 'm4a': return 'M4A';
        case 'aac': return 'AAC';
        case 'wma': return 'WMA';
        default: return fileExtension.toUpperCase();
      }
    };

    return {
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
      bitDepth: estimateBitDepth(),
      format: getFormat(),
      duration: audioBuffer.duration
    };
  }, []);

  const formatTime = useCallback((time: number) => {
    if (!isFinite(time) || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const formatSampleRate = useCallback((sampleRate: number) => {
    if (sampleRate >= 1000) {
      return `${(sampleRate / 1000).toFixed(1)}kHz`;
    }
    return `${sampleRate}Hz`;
  }, []);

  const getChannelText = useCallback((channels: number) => {
    switch (channels) {
      case 1: return 'Mono';
      case 2: return 'Stereo';
      case 6: return '5.1';
      case 8: return '7.1';
      default: return `${channels}ch`;
    }
  }, []);

  const formatFileSize = useCallback((sizeBytes: number) => {
    return (sizeBytes / 1024 / 1024).toFixed(2);
  }, []);

  return {
    extractAudioMetadata,
    formatTime,
    formatSampleRate,
    getChannelText,
    formatFileSize
  };
};