export const defaultTest = `package test

import (
	"context"
	"os"
	"strings"
	"testing"

	//"runner/shared"

	"github.com/distcodep7/dsnet/dsnet"
	"github.com/distcodep7/dsnet/testing/controller"
	"github.com/distcodep7/dsnet/testing/disttest"
	"github.com/distcodep7/dsnet/testing/wrapper"
)

var (
    Peers = []string{}
    Id    string
    WM    *wrapper.WrapperManager
    ctx   context.Context
)

func TestMain(m *testing.M) {
    Peers = strings.Split(os.Getenv("PEERS"), ", ")
    Id = os.Getenv("ID")
    ctx = context.Background()
    WM = wrapper.NewWrapperManager(8090, Peers...)
    WM.ReadyAll(ctx)

    code := m.Run()
    _ = disttest.Write("test_results.json")
    WM.ShutdownAll(ctx)
    os.Exit(code)
}

func TestExample(t *testing.T) {
    disttest.Wrap(t, func(t *testing.T) {
        go controller.Serve(controller.TestConfig{})

        WM.StartAll(ctx)

        tester, err := dsnet.NewNode("TESTER", "localhost:50051")
        if err != nil {
            disttest.Fail(t, "Failed to start node")
        }
        msg := dsnet.BaseMessage{
            From: "TESTER",
            To:   Peers[0],
            Type: "ExampleMessage",
        }
        tester.Send(ctx, Peers[0], msg)
    })
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
