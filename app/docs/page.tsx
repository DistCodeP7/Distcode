import { ExternalLink, Link2, Terminal } from "lucide-react";
import MarkdownPreview from "@/components/custom/markdownPreview";
import NeonLines from "@/components/custom/neonLine";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DocsNavigation } from "./DocsComponents";

export default function DocsPage() {
  return (
    <div className="min-h-screen w-full bg-background/95 relative selection:bg-primary/20">
      <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
        <NeonLines count={40} />
      </div>

      <div className="container mx-auto py-6 md:py-10 px-4">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              Documentation
            </h1>
            <div className="flex gap-2">
              <Badge variant="outline" className="h-6">
                v1.2.0
              </Badge>
              <Badge className="h-6">Beta</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <DocsNavigation />

          <main className="lg:col-span-9 space-y-10">
            {/* 1. Introduction */}
            <section id="intro" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-primary" />
                    Getting Started
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="leading-7">
                    Welcome to the DistCode documentation page. DistCode uses a
                    three-part code structure for exercises: Protocol Code, Test
                    Code, and User Code.
                  </p>
                  <Alert className="bg-muted/50">
                    <Link2 className="h-4 w-4" />
                    <AlertTitle>DSnet Reference</AlertTitle>
                    <AlertDescription className="mt-2 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <span>
                        For in-depth information on the underlying networking
                        library used by DistCode.
                      </span>
                      <Button size="sm" variant="secondary" asChild>
                        <a
                          href="https://pkg.go.dev/github.com/distcodep7/dsnet"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="gap-2"
                        >
                          View Go Package <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter />
              </Card>
            </section>

            {/* 2. Communication Protocol */}
            <section id="communication-protocol">
              <div className="mb-4">
                <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0">
                  Communication Protocol
                </h2>
                <Separator className="my-2" />
              </div>
              <Card>
                <CardContent className="pt-6">
                  <MarkdownPreview
                    content={getSectionProtocol()}
                    color="card"
                  />
                </CardContent>
                <CardFooter />
              </Card>
            </section>

            {/* 3. Testing Harness */}
            <section id="testing-harness">
              <div className="mb-4">
                <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                  Testing Harness
                </h2>
                <Separator className="my-2" />
              </div>
              <Card>
                <CardContent className="pt-6">
                  <MarkdownPreview content={getSectionHarness()} />
                </CardContent>
                <CardFooter />
              </Card>
            </section>

            {/* 4. User Submission */}
            <section id="user-submission">
              <div className="mb-4">
                <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                  User Submission
                </h2>
                <Separator className="my-2" />
              </div>
              <Card>
                <CardContent className="pt-6">
                  <MarkdownPreview content={getSectionUserSubmission()} />
                </CardContent>
                <CardFooter />
              </Card>
            </section>

            {/* 5. Full Example Header */}
            <section id="full-example" className="pt-8">
              <Alert
                variant="default"
                className="border-primary/50 bg-primary/5"
              >
                <Terminal className="h-4 w-4" />
                <AlertTitle className="font-bold text-lg">
                  Full Example: Echo Broadcast Exercise
                </AlertTitle>
                <AlertDescription>
                  In this exercise, users are required to implement an algorithm
                  that participates in an echo broadcast protocol.
                </AlertDescription>
              </Alert>
            </section>

            {/* 5a. Full Protocol */}
            <section id="full-protocol">
              <h3 className="text-xl font-semibold mb-2">
                Protocol Definition
              </h3>
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <MarkdownPreview
                    content={`\`\`\`go\n${echoProtocol()}\n\`\`\``}
                  />
                </CardContent>
                <CardFooter />
              </Card>
            </section>

            {/* 5b. Full Test */}
            <section id="full-harness">
              <h3 className="text-xl font-semibold mb-2">
                Test Implementation
              </h3>
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <MarkdownPreview
                    content={`\`\`\`go\n${echoTest()}\n\`\`\``}
                  />
                </CardContent>
                <CardFooter />
              </Card>
            </section>

            {/* 5c. Full User Code */}
            <section id="full-impl">
              <h3 className="text-xl font-semibold mb-2">
                User Implementation
              </h3>
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <MarkdownPreview
                    content={`\`\`\`go\n${echoUser()}\n\`\`\``}
                  />
                </CardContent>
                <CardFooter />
              </Card>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function getSectionProtocol() {
  return `
The protocol defines the message types and structures used in the exercise. DistCode exercises usually go with a internal-external message flow design, 
where external messages are used as ***orchestration triggers*** between tester and worker nodes, while internal messages handle the core protocol logic.

An example protocol can be seen below. The DSnet \`BaseMessage\` must be embedded in all message types.

\`\`\`go
${exampleProtocolCode()}
\`\`\`
`;
}

function getSectionHarness() {
  return `
The test code (***Testing harness***) sets up the testing environment, creates nodes, and defines the test logic.
It interacts with the user's implementation through the defined protocol.

A \`testConfig\` can be defined to set message event parameters such as probabilities and timeouts. 
DSnet includes options for dropping, delaying and duplicating messages to simulate real-world network conditions. 

\`\`\`go
${exampleTestCode()}
\`\`\`
`;
}

function getSectionUserSubmission() {
  return `
The user code is where the user implements the logic for their DSnet node(s).
Users will typically create one or more DSnet nodes, and implement event handlers to process incoming messages and respond appropriately.

\`\`\`go
${exampleuserCode()}
\`\`\`
`;
}

function exampleProtocolCode() {
  return `type EchoMessage struct {
    BaseMessage
    EchoID  string
    Content string

// External Trigger
trigger:
    message: BaseMessage // type: "trigger"
    payload

// Internal Protocol
message:
    message: BaseMessage // type: "message"
    payload

response:
    message: BaseMessage // type: "response"
    payload

// External Result
result:
    message: BaseMessage // type: "result"
    payload
`;
}

function exampleTestCode() {
  return `TestConfig:
    message event probabilities

server.start(TestConfig)

createNode(tester)

TriggerMessage:
    BaseMessage:
        to: "worker"
        from: "tester"
        type: "trigger"
    content: "hello, world"

send(TriggerMessage)

loop forever:
    event := wait for inbound message or timeout
    if event received:
        if event.type == "Result":
            print("TEST PASSED")
            exit
    else if timeout:
        print("TEST FAILED")
        exit
`;
}

function exampleuserCode() {
  return `ExampleNode:
    DSnet node interface
    id: NodeID

function handle(event):
    switch event.type:
        case "trigger":
            handleTrigger(event)
        case "message":
            handleMessage(event)
        case "response":
            handleResponse(event)

function main:
    createNode("worker")
    loop forever:
        event := wait for inbound message
        handle(event)
`;
}

function echoProtocol() {
  return `package shared

import "github.com/distcodep7/dsnet/dsnet"

type SendTrigger struct {
    dsnet.BaseMessage      // Type: "SendTrigger"
    EchoID              string
    Content             string
}

type EchoMessage struct {
    dsnet.BaseMessage     // Type: "EchoMessage"
    EchoID              string
    Content             string
}

type EchoResponse struct {
    dsnet.BaseMessage     // Type: "EchoResponse"
    EchoID              string
    Content             string
}

type ReplyReceived struct {
    dsnet.BaseMessage     // Type: "ReplyReceived"
    EchoID              string
    Success             bool
}`;
}

function echoTest() {
  return `package test

import (
    "context"
    "encoding/json"
    "log"
    "os"
    "strings"
    "testing"
    "time"

    "runner/shared"

    "github.com/distcodep7/dsnet/dsnet"
    "github.com/distcodep7/dsnet/testing/controller"
    "github.com/distcodep7/dsnet/testing/disttest"
    "github.com/distcodep7/dsnet/testing/wrapper"
)

var (
    Peers []string
    ID    string
    WM    *wrapper.WrapperManager
    ctx   context.Context
)

func TestMain(m *testing.M) {
    Peers = strings.Split(os.Getenv("PEERS"), ",")
    ID = os.Getenv("ID")
    ctx = context.Background()
    WM = wrapper.NewWrapperManager(8090, Peers...)

    const attempts = 200
    const sleepInterval = 50 * time.Millisecond
    for i := 1; i <= attempts; i++ {
        errors := WM.ReadyAll(ctx)
        allReady := true
        for peer, err := range errors {
            if err != nil {
                allReady = false
                log.Printf("Peer %s not ready: %v", peer, err)
            }
        }
        if allReady {
            log.Println("All peers are ready")
            break
        }
        time.Sleep(sleepInterval)
    }

    code := m.Run()
    _ = disttest.Write("test_results.json")
    WM.ShutdownAll(ctx)
    os.Exit(code)
}

func TestEchoTwoNodes(t *testing.T) {
    disttest.Wrap(t, func(t *testing.T) {
        go controller.Serve(controller.TestConfig{})
        time.Sleep(2 * time.Second)

        WM.StartAll(ctx)
        time.Sleep(3 * time.Second)

        tester, err := dsnet.NewNode("TESTER", "localhost:50051")
        if err != nil {
            t.Fatalf("Failed to create TESTER node: %v", err)
        }
        defer tester.Close()

        trigger := shared.SendTrigger{
            BaseMessage: dsnet.BaseMessage{
                From: "TESTER",
                To:   Peers[0],
                Type: "SendTrigger",
            },
            EchoID:  "TEST_001",
            Content: "Hello, DSNet!",
        }
        tester.Send(ctx, Peers[0], trigger)
        log.Printf("Sent SendTrigger %s to %s", trigger.Content, Peers[0])

        timeout := time.After(30 * time.Second)
        for {
            select {
            case event := <-tester.Inbound:
                if event.Type == "ReplyReceived" {
                    var result shared.ReplyReceived
                    json.Unmarshal(event.Payload, &result)

                    if result.EchoID == "TEST_001" {
                        log.Printf("✅ TEST PASSED: Received EchoResponse from %s", Peers[0])
                        return
                    }
                }
            case <-timeout:
                t.Fatal("Timed out waiting for ReplyReceived")
            }
        }
    })
}`;
}

function echoUser() {
  return `package main

import (
    "context"
    "encoding/json"
    "log"
    "os"
    "strings"

    "runner/shared"

    "github.com/distcodep7/dsnet/dsnet"
)

var totalNodes  int
var Peers       []string
var id          string

type EchoNode struct {
    Net            *dsnet.Node
    pendingReplies map[string]map[string]bool // echoID -> map[nodeID]bool
}

func NewEchoNode(id string) *EchoNode {
    n, err := dsnet.NewNode(id, "test-container:50051")
    if err != nil {
        log.Fatalf("Failed to create node %s: %v", id, err)
        os.Exit(0)
    }
    return &EchoNode{Net: n, pendingReplies: make(map[string]map[string]bool)}
}

func newBaseMessage(from, to, msgType string) dsnet.BaseMessage {
    return dsnet.BaseMessage{
        From: from,
        To:   to,
        Type: msgType,
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
    totalNodes = len(Peers)

    ctx := context.Background()
    echoNode := NewEchoNode(id)
    defer echoNode.Net.Close()
    echoNode.Run(ctx)
}

func (en *EchoNode) Run(ctx context.Context) {
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

        if en.pendingReplies == nil {
            en.pendingReplies = make(map[string]map[string]bool)
        }
        en.pendingReplies[msg.EchoID] = make(map[string]bool)
        en.SendToAll(ctx, msg.EchoID, msg.Content)
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

        if en.pendingReplies == nil {
            en.pendingReplies = make(map[string]map[string]bool)
        }
        if en.pendingReplies[resp.EchoID] == nil {
            en.pendingReplies[resp.EchoID] = make(map[string]bool)
        }

        fromNode := resp.From
        if fromNode == en.Net.ID {
            return // ignore self
        }

        // only mark first response from a node
        if !en.pendingReplies[resp.EchoID][fromNode] {
            en.pendingReplies[resp.EchoID][fromNode] = true
        }

        if len(en.pendingReplies[resp.EchoID]) == totalNodes-1 {
            // All replies received
            en.Net.Send(ctx, "TESTER",  shared.ReplyReceived{
                BaseMessage: newBaseMessage(en.Net.ID, "TESTER", "ReplyReceived"),
                EchoID:      resp.EchoID,
                Success:     true,
            })
        }
    }
}

func (en *EchoNode) SendToAll(ctx context.Context, echoID string, content string) {
    for i := 1; i <= totalNodes; i++ {
        nodeID := Peers[i-1]
        if nodeID == en.Net.ID {
            continue // skip self
        }

        en.Net.Send(ctx, nodeID, shared.EchoMessage{
            BaseMessage: newBaseMessage(en.Net.ID, nodeID, "EchoMessage"),
            EchoID:      echoID,
            Content:     content,
        })
    }
}`;
}
