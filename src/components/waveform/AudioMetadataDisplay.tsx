import React from 'react';
import { AudioMetadata, useAudioMetadata } from '../../hooks/useAudioMetadata';

interface AudioMetadataDisplayProps {
  file: File;
  audioMetadata: AudioMetadata | null;
  isSidebarCollapsed?: boolean;
}

export const AudioMetadataDisplay: React.FC<AudioMetadataDisplayProps> = ({
  file,
  audioMetadata,
  isSidebarCollapsed
}) => {
  const { formatSampleRate, getChannelText, formatFileSize } = useAudioMetadata();

  return (
    <div className={`flex items-center text-xs text-audio-text-dim font-mono ${
      isSidebarCollapsed ? 'gap-6' : 'gap-4'
    }`}>
      {/* File Size */}
      <div className="text-center">
        <div className="text-white font-semibold">{formatFileSize(file.size)} MB</div>
        <div className="text-audio-text-dim">Size</div>
      </div>
      
      {/* Sample Rate */}
      <div className="text-center">
        <div className="text-white font-semibold">
          {audioMetadata ? formatSampleRate(audioMetadata.sampleRate) : '---'}
        </div>
        <div className="text-audio-text-dim">Sample Rate</div>
      </div>
      
      {/* Bit Depth / Bitrate */}
      <div className="text-center">
        <div className="text-white font-semibold">
          {audioMetadata ? audioMetadata.bitDepth : '---'}
        </div>
        <div className="text-audio-text-dim">
          {audioMetadata?.format === 'MP3' || audioMetadata?.format === 'AAC' ? 'Bitrate' : 'Bit Depth'}
        </div>
      </div>
      
      {/* Channels */}
      <div className="text-center">
        <div className="text-white font-semibold">
          {audioMetadata ? getChannelText(audioMetadata.channels) : '---'}
        </div>
        <div className="text-audio-text-dim">Channels</div>
      </div>
    </div>
  );
};