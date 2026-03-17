import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FilesPanel } from '../../src/components/sidebar/FilesPanel';
import type { RecentFile } from '../../src/types/recentFile';

const createRecentFile = (overrides: Partial<RecentFile> = {}): RecentFile => {
  const file = overrides.file ?? new File(['audio-data'], overrides.name ?? 'staged-track.wav', {
    type: 'audio/wav',
    lastModified: 1710000000000,
  });

  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    size: '0.0 MB',
    lastModified: '3/9/2024',
    lastUsedSide: null,
    file,
    ...overrides,
  };
};

describe('FilesPanel', () => {
  it('shows deck actions for unassigned files and loads the selected deck', () => {
    const onLoadToA = jest.fn();
    const stagedFile = createRecentFile();

    render(
      <FilesPanel
        recentFiles={[stagedFile]}
        onLoadToA={onLoadToA}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /staged-track\.wav/i }));
    fireEvent.click(screen.getByRole('button', { name: /load staged-track\.wav to deck a/i }));

    expect(onLoadToA).toHaveBeenCalledWith(stagedFile.file);
  });

  it('forwards dropped audio files and ignores unsupported files', () => {
    const onAddDroppedFiles = jest.fn();
    const audioFile = new File(['audio-data'], 'club-loop.mp3', { type: 'audio/mpeg' });
    const invalidFile = new File(['notes'], 'notes.txt', { type: 'text/plain' });

    render(
      <FilesPanel onAddDroppedFiles={onAddDroppedFiles} />
    );

    const dropZone = screen.getByTestId('files-panel-dropzone');

    fireEvent.dragEnter(dropZone, {
      dataTransfer: {
        items: [{ kind: 'file', type: 'audio/mpeg' }],
        files: [audioFile, invalidFile],
      },
    });

    expect(screen.getByText(/drop audio files here/i)).toBeInTheDocument();

    fireEvent.drop(dropZone, {
      dataTransfer: {
        items: [
          { kind: 'file', type: 'audio/mpeg' },
          { kind: 'file', type: 'text/plain' },
        ],
        files: [audioFile, invalidFile],
      },
    });

    expect(onAddDroppedFiles).toHaveBeenCalledWith([audioFile]);
    expect(screen.queryByText(/drop audio files here/i)).not.toBeInTheDocument();
  });
});