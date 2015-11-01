// Copyright 2015 Keybase Inc. All rights reserved.
// Use of this source code is governed by a BSD
// license that can be found in the LICENSE file.

package libkb

import (
	"io"
	"os"
)

// File defines a default SafeWriter implementation
type File struct {
	filename string
	data     []byte
	perm     os.FileMode
}

// NewFile returns a File
func NewFile(filename string, data []byte, perm os.FileMode) File {
	return File{filename, data, perm}
}

// Save file
func (f File) Save() error {
	return SafeWriteToFile(f, f.perm)
}

// GetFilename is for SafeWriter
func (f File) GetFilename() string {
	return f.filename
}

// WriteTo is for SafeWriter
func (f File) WriteTo(w io.Writer) (int64, error) {
	n, err := w.Write(f.data)
	return int64(n), err
}
