export const defaultMain = `
package main

import (
    "os"
    "strings"

    //"runner/shared"

    "github.com/distcodep7/dsnet/dsnet"
)

var (
    Peers []string
    Id    string
)

func(n *dsnet.Node) Run() {
    n.Send(dsnet.BaseMessage{
        From: Id,
        To:   "TESTER",
        payload: "Hello, World!",
    })
    return
}

func main(){
    Peers = strings.Split(os.Getenv("PEERS"), ",")
    Id = os.Getenv("ID")

    Node := dsnet.NewNode(Id)
    Node.Run()
}`;
