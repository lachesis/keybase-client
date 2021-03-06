// Copyright 2015 Keybase, Inc. All rights reserved. Use of
// this source code is governed by the included BSD license.

package libkb

import (
	"testing"

	keybase1 "github.com/keybase/client/go/protocol"
)

func TestLoadUserPlusKeys(t *testing.T) {
	tc := SetupTest(t, "user plus keys")
	defer tc.Cleanup()

	// this is kind of pointless as there is no cache anymore
	for i := 0; i < 10; i++ {
		u, err := LoadUserPlusKeys(tc.G, "295a7eea607af32040647123732bc819")
		if err != nil {
			t.Fatal(err)
		}
		if u.Username != "t_alice" {
			t.Errorf("username: %s, expected t_alice", u.Username)
		}
		if len(u.RevokedDeviceKeys) > 0 {
			t.Errorf("t_alice found with %d revoked keys, expected 0", len(u.RevokedDeviceKeys))
		}
	}

	for _, uid := range []keybase1.UID{"295a7eea607af32040647123732bc819", "afb5eda3154bc13c1df0189ce93ba119", "9d56bd0c02ac2711e142faf484ea9519", "c4c565570e7e87cafd077509abf5f619", "561247eb1cc3b0f5dc9d9bf299da5e19"} {
		_, err := LoadUserPlusKeys(tc.G, uid)
		if err != nil {
			t.Fatal(err)
		}
	}
}

func BenchmarkLoadSigChains(b *testing.B) {
	tc := SetupTest(b, "benchmark load user")
	u, err := LoadUser(NewLoadUserByNameArg(tc.G, "kwejfkwef"))
	if err != nil {
		b.Fatal(err)
	}
	if u == nil {
		b.Fatal("no user")
	}
	u.sigChainMem = nil
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		if err = u.LoadSigChains(true, &u.leaf, false); err != nil {
			b.Fatal(err)
		}
		u.sigChainMem = nil
	}
}
