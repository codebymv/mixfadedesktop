import { Activity } from 'lucide-react';
import type { ComponentProps } from 'react';
import { ABSwitch } from '../ABSwitch';
import { FileUpload } from '../FileUpload';
import type { ColorTheme } from '../../theme/colorThemes';

type ActiveTrack = 'A' | 'B' | 'both';
type CrossfadeDirection = 'A->B' | 'B->A' | null;
type ABSwitchDirection = ComponentProps<typeof ABSwitch>['crossfadeDirection'];

interface UploadMixerSectionProps {
  trackA: File | null;
  trackB: File | null;
  hasAnyAudio: boolean;
  hasBothAudio: boolean;
  activeColorTheme: ColorTheme;
  activeTrack: ActiveTrack;
  isTransitioning: boolean;
  volumeA: number;
  volumeB: number;
  crossfadeDirection: CrossfadeDirection;
  onTrackASelect: (file: File | null) => void;
  onTrackBSelect: (file: File | null) => void;
  onTrackSwitch: (track: ActiveTrack) => void;
}

export function UploadMixerSection({
  trackA,
  trackB,
  hasAnyAudio,
  hasBothAudio,
  activeColorTheme,
  activeTrack,
  isTransitioning,
  volumeA,
  volumeB,
  crossfadeDirection,
  onTrackASelect,
  onTrackBSelect,
  onTrackSwitch,
}: UploadMixerSectionProps) {
  return (
    <section className={`${!hasAnyAudio ? 'min-h-[60vh] flex items-center justify-center' : ''}`}>
      <div className={`${!hasAnyAudio ? 'w-full max-w-6xl' : ''}`}>
        <div className={`grid grid-cols-1 lg:grid-cols-5 items-center transition-all duration-300 ${
          hasAnyAudio && !hasBothAudio ? 'gap-3' : 'gap-6'
        }`}>
          <div className="lg:col-span-2">
            <FileUpload
              label="Deck A"
              color="green"
              file={trackA}
              onFileSelect={onTrackASelect}
            />
          </div>

          <div className="lg:col-span-1 flex justify-center">
            {hasBothAudio ? (
              <ABSwitch
                activeTrack={activeTrack}
                onSwitch={onTrackSwitch}
                isTransitioning={isTransitioning}
                volumeA={volumeA}
                volumeB={volumeB}
                crossfadeDirection={crossfadeDirection as ABSwitchDirection}
              />
            ) : (
              <div className="w-full h-32 flex items-center justify-center">
                <div className="text-audio-text-dim text-sm text-center">
                  <div className="w-16 h-16 rounded-2xl border-2 border-gradient-to-r from-emerald-500/20 to-purple-500/20 flex items-center justify-center mb-2 mx-auto">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={activeColorTheme.deckA.base} />
                          <stop offset="100%" stopColor={activeColorTheme.deckB.base} />
                        </linearGradient>
                      </defs>
                      <Activity size={24} stroke="url(#iconGradient)" />
                    </svg>
                  </div>
                  <p>Upload both files</p>
                  <p className="text-xs">to enable crossfade</p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <FileUpload
              label="Deck B"
              color="purple"
              file={trackB}
              onFileSelect={onTrackBSelect}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
