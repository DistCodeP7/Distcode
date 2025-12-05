export const defaultTest = `package test

import (
    "os"
    "strings"
    "testing"

    "github.com/distcodep7/dsnet/testing/disttest"
    "github.com/distcodep7/dsnet/testing/wrapper"
)

var (
    Peers = []string{}
    Id    string
)

func TestMain(m *testing.M) {
    Peers = strings.Split(os.Getenv("PEERS"), ", ")
    Id = os.Getenv("ID")
    aliases := make([]wrapper.Alias, len(Peers))
    for i, peer := range Peers {
        aliases[i] = wrapper.Alias(peer)
    }

    code := m.Run()
    _ = disttest.Write("test_results.json")
    os.Exit(code)
}

func TestSuccess(t *testing.T) {
    disttest.Wrap(t, func(t *testing.T) {
        
    })
}

func TestFails(t *testing.T) {
    disttest.Wrap(t, func(t *testing.T) {
        panic("SOME REASON")
    })
}
`;
