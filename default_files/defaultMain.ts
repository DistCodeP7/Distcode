export const defaultMain = `package main

import (
  "fmt"
  "os"
  "strings"
)
func main(){
    Peers = strings.Split(os.Getenv("PEERS"), ", ")
    Id = os.Getenv("ID")
    aliases := make([]wrapper.Alias, len(Peers))
    for i, peer := range Peers {
        aliases[i] = wrapper.Alias(peer)
    }
    fmt.Println("SUP")
}`;
