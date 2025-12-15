"use client";
import MarkdownPreview from "@/components/custom/markdownPreview";
import NeonLines from "@/components/custom/neonLine";


export default function DocsPage() {
  return (
    <div className="container mx-auto py-10">
      <div>
        <NeonLines count={80} />
      </div>

      {/* <h1 className="text-4xl sm:text-5xl font-bold text-center sm:text-left text-foreground">
        DistCode
      </h1>
      <p className="text-muted-foreground text-lg sm:text-xl max-w-3xl text-center sm:text-left mt-4">
        Welcome to the documentation page. Here you will find guides and
        references to help you get started with our platform.
        https://pkg.go.dev/github.com/distcodep7/dsnet
      </p> */}
      <MarkdownPreview content={generateDocs(exampleProtocolCode, exampleTestCode, exampleuserCode)} />
    </div>
  );
}

function generateDocs(...args: any[]) {
    return `
# DistCode Documentation

Welcome to the documentation page. Here you will find a guide and references to help you get started with our platform.
Follow the link to the DSnet Go package for more in-depth information on the underlying networking library used by DistCode.

<div style="text-align: center;">
<a href="https://pkg.go.dev/github.com/distcodep7/dsnet" target="_blank" rel="noopener noreferrer">
https://pkg.go.dev/github.com/distcodep7/dsnet
</a>
</div>


DistCode uses a three-part code structure for exercises: Protocol Code, Test Code, and User Code. Below are examples of each part and a full user implementation of Echo at the bottom.

<div style="text-align: center; font-size: 14px;">

## Table of Contents

[Protocol Code](#protocol-code)

[Test Code](#test-code)

[User Code](#user-code)

[Full Example: Echo Broadcast Exercise](#full-example-echo-broadcast-exercise)

</div>

## Protocol Code
[Back to Top](#distcode-documentation)

The protocol defines the message types and structures used in the exercise. DistCode exercises usually go with a internal-external message flow design, 
where external messages are used as ***orchestration triggers*** between tester and worker nodes, while internal messages handle the core protocol logic.

An example protocol can be seen below with minimal message definitions to give an indication of the structure. At the top is the DSnet BaseMessage contract which must be embedded in all message types. 
This defines the sender, receiver, and type of the message. 

\`\`\`go
${exampleProtocolCode()}
\`\`\`

## Test Code
[Back to Top](#distcode-documentation)

The test code (***Testing harness***) sets up the testing environment, creates nodes needed to handle testing communication, and defines the test logic and topology of the exercise network.
It interacts with the user's implementation through the defined protocol.
The testing harness is responsible for sending trigger messages to start tests and evaluating the results based on the responses from the user's nodes.

A testConfig can be defined to set message event parameters such as probabilities and timeouts. 
DSnet includes options for dropping, delaying and duplicating messages to simulate real-world network conditions. As well as options for simulating network latency spikes.
The testing harness also has the capability to manipulate the network topology during the test, such as crashing, restarting nodes and partitioning the network, to test the robustness of the user's implementation.

\`\`\`go
${exampleTestCode()}
\`\`\`

## User Code
[Back to Top](#distcode-documentation)

The user code is where the user implements the logic for their DSnet node(s) based on the provided protocol and environment.
The user's implementation must adhere to the message structures and types defined in the protocol.
Users will typically create one or more DSnet nodes, and implement event handlers to process incoming messages and respond appropriately.

As seen in the example below, users are free to extend the DSnet Node interface to include additional state or helper methods as needed for their implementation.

\`\`\`go
${exampleuserCode()}
\`\`\`



# Full Example: Echo Broadcast Exercise
## Description

In this exercise, users are required to implement an algorithm that participates in an echo broadcast protocol.
When a tester node sends a Trigger message to one of the worker nodes, that node must broadcast an EchoMessage to all other nodes in the network.
Each node that receives an EchoMessage must reply with an EchoResponse back to the original sender.
Once the original sender has received EchoResponses from all other nodes, it sends a ReplyReceived message back to the tester node indicating success.

## Protocol
[Back to Top](#distcode-documentation)

The Echo Broadcast protocol consists of four message types: SendTrigger, EchoMessage, EchoResponse, and ReplyReceived, as defined below:

Here, the sendTrigger and ReplyReceived messages are used for external communication between the tester and worker nodes.
EchoMessage and EchoResponse are meant for internal protocol communication among the worker nodes, but the internal message protocol can be used by the user as they see fit.

\`\`\`go
${echoProtocol()}
\`\`\`

## Testing Harness
[Back to Top](#distcode-documentation)

The testing harness for the above protocol can be seen below:

DistCode uses a ***Disttest*** wrapper using the built-in Golang testing package to manage the lifecycle of the test.
This wrapper wraps all tests of a single exercise, handling logging of test results.

All exercises have a set of environment variables passed to each docker container at startup. This includes the list of peers in the network and the unique ID of the node.
Test authors can set up environment variables either globally for all nodes or individually per node. 
In the main function of the example below, the testing harness sets up a docker wrapper to handle network topology manipulation and readies all nodes before starting the test.

In the test, the testing harness creates controller with an empty testConfig (testConfig parameters can be found in on the DSnet package page), 
a tester node and sends a SendTrigger message to one of the worker nodes to initiate the echo broadcast.
It then waits for a ReplyReceived message from the worker node to determine if the test passed or failed.

\`\`\`go
${echoTest()}
\`\`\`

## User Implementation
[Back to Top](#distcode-documentation)

Below is the complete code for the Echo Broadcast submission. This include an EchoNode extension of the DSnet Node.
The user implements the node logic. The user is responsible for instantiating the node, handling incoming events, and sending messages according to the protocol.
In this case, when a SendTrigger is received, the node broadcasts an EchoMessage to all other nodes.
Upon receiving an EchoMessage, the node replies with an EchoResponse back to the sender.
The node keeps track of received EchoResponses and once all have been received, it sends a ReplyReceived message back to the tester node.

\`\`\`go
${echoUser()}
\`\`\`

[Back to Top](#distcode-documentation)
    `
}

function exampleProtocolCode() {
    return `
    type EchoMessage struct {
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
    return `
    TestConfig:
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
    return `
    ExampleNode:
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
return `
    package shared

    import "github.com/distcodep7/dsnet/dsnet"

    type SendTrigger struct {
        dsnet.BaseMessage      // Type: "SendTrigger"
        EchoID 				string
        Content      		string
    }

    type EchoMessage struct {
        dsnet.BaseMessage     // Type: "EchoMessage"
        EchoID		 		string
        Content         	string
    }

    type EchoResponse struct {
        dsnet.BaseMessage     // Type: "EchoResponse"
        EchoID		 		string
        Content         	string
    }

    type ReplyReceived struct {
        dsnet.BaseMessage
        EchoID 				string
        Success 			bool
    }
`;
}

function echoTest() {
  return `
    package test

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
}
    `
} 

function echoUser() {
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

var totalNodes 	int
var Peers 		[]string
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
			en.Net.Send(ctx, "TESTER", 	shared.ReplyReceived{
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