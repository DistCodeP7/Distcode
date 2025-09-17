'use client';

import { AuthProvider } from '@/components/custom/auth-provider';
import Editor, { EditorHeader } from '@/components/custom/editor';
import MarkdownPreview from '@/components/custom/markdown-preview';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { useState } from 'react';

export default function IDE() {
  const [file, setFile] = useState(0);

  const onSubmit = (code: string) => {
    console.log('Submitted code:', code);
  };

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full border md:min-w-[450px]"
    >
      <ResizablePanel minSize={20} className="overflow-y-auto">
        <MarkdownPreview />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel minSize={20}>
        <EditorHeader
          files={[
            { name: 'file1.go', fileType: 'go' },
            { name: 'file2.erl', fileType: 'erlang' },
            { name: 'file2.akka', fileType: 'akka' },
          ]}
          activeFile={file}
          onFileChange={(index) => setFile(index)}
        />
        <Editor onSubmit={onSubmit} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
