export const defaultMain = `package main

import (
  "os"
  "strings"
)
func main(){
    Peers = strings.Split(os.Getenv("PEERS"), ",")
    Id = os.Getenv("ID")
}`;
