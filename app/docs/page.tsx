"use client";
import MarkdownPreview from "@/components/custom/markdown-preview";
import NeonLines from "@/components/custom/NeonLine";

// Return the markdown content
function test(exampleCode: string) {
  return `# Example Echo Node Implementation
This page explains the DSNet framework by walking through an example implementation of a simple echo node.
The echo node will receive messages from a tester node, echo them back, and handle responses.

\`\`\`go
${exampleCode}
\`\`\`
# Test

\`\`\`go
Test go
\`\`\`

\`\`\`go
${exampleCode}
\`\`\`
`;
}

// Returns the full Go example code
function FullExampleCode() {
  return `
package main

import (
    "context"
    "encoding/json"
    "log"
    "os"
    "strings"

    "runner/shared"

    "github.com/distcodep7/dsnet/dsnet"
)

var Peers []string

type EchoNode struct{ Net *dsnet.Node }

func NewEchoNode(id string) *EchoNode {
    n, err := dsnet.NewNode(id, "test-container:50051")
    if err != nil {
        log.Fatalf("Failed to create node %s: %v", id, err)
    }
    
    return &EchoNode{Net: n}
}

func newBaseMessage(from, to, msgType string) dsnet.BaseMessage {
    return dsnet.BaseMessage{From: from, To: to, Type: msgType}
}

func (en *EchoNode) Run(ctx context.Context) {
    defer en.Net.Close()
    for {
        select {
        case event := <-en.Net.Inbound:
            en.handleEvent(ctx, event)
        case <-ctx.Done():
            os.Exit(0)
        }
    }
}

func (en *EchoNode) handleEvent(ctx context.Context, event dsnet.Event) {
    switch event.Type {
    case "SendTrigger":
        var msg shared.SendTrigger
        json.Unmarshal(event.Payload, &msg)
        en.Net.Send(ctx, Peers[1], shared.EchoMessage{
            BaseMessage: newBaseMessage(en.Net.ID, Peers[1], "EchoMessage"),
            EchoID:      msg.EchoID,
            Content:     msg.Content,
        })
    case "EchoMessage":
        var msg shared.EchoMessage
        json.Unmarshal(event.Payload, &msg)
        
        en.Net.Send(ctx, msg.From, shared.EchoResponse{
            BaseMessage: newBaseMessage(en.Net.ID, msg.From, "EchoResponse"),
            EchoID:      msg.EchoID,
            Content:     msg.Content,
        })
    case "EchoResponse":
        var resp shared.EchoResponse
        json.Unmarshal(event.Payload, &resp)

        en.Net.Send(ctx, "TESTER", shared.ReplyReceived{
            BaseMessage: newBaseMessage(en.Net.ID, "TESTER", "ReplyReceived"),
            EchoID:      resp.EchoID,
            Success:     true,
        })
    }
}

func main() {
    id := os.Getenv("ID")
    if id == "" {
        log.Fatal("ID environment variable not set")
        return
    }
    Peers = strings.Split(os.Getenv("PEERS"), ",")
    if Peers == nil {
        log.Fatal("PEERS environment variable not set")
        return
    }

    ctx := context.Background()
    echoNode := NewEchoNode(id)
    defer echoNode.Net.Close()
    go echoNode.Run(ctx)
    select {}
}
`;
}

export default function DocsPage() {
  return (
    <div className="container mx-auto py-10">
      <div>
        <NeonLines count={80} />
      </div>

      <h1 className="text-4xl sm:text-5xl font-bold text-center sm:text-left text-foreground">
        DistCode
      </h1>
      <p className="text-muted-foreground text-lg sm:text-xl max-w-3xl text-center sm:text-left mt-4">
        Welcome to the documentation page. Here you will find guides and
        references to help you get started with our platform.
        https://pkg.go.dev/github.com/distcodep7/dsnet
      </p>
      <MarkdownPreview content={test(FullExampleCode())} />
    </div>
  );
}
