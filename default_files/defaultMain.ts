export const defaultMain = `
package main

import (
	"context"
	"log"
	"os"
	"strings"

	"github.com/distcodep7/dsnet/dsnet"
)

var (
    Peers []string
    Id    string
)

type ExampleNode struct { node *dsnet.Node }

func(n *ExampleNode) Run(ctx context.Context) {
    time.Sleep(1 * time.Second)
    msg := dsnet.BaseMessage{
        From: Id,
        To:   "TESTER",
        Type: "ExampleMessage",
    }
    n.node.Send(ctx, "TESTER", msg)
    return
}

func main(){
    Peers = strings.Split(os.Getenv("PEERS"), ",")
    Id = os.Getenv("ID")
	ctx := context.Background()
	
    n, err := dsnet.NewNode(Id, "test-container:50051")
	if err != nil {
		log.Fatalf("Failed to create node")
	}
    Node := ExampleNode{ node: n }
    Node.Run(ctx)
}
`;
