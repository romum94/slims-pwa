import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { useAuth } from '../context/AuthContext.jsx';
import { lookupBookByIsbn } from '../api/bookLookup.js';

export default function ScanIsbn() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const controlsRef = useRef(null);

  const [scanning, setScanning] = useState(true);
  const [manualIsbn, setManualIsbn] = useState('');
  const [status, setStatus] = useState('idle');
  const [scannedIsbn, setScannedIsbn] = useState('');
  const [book, setBook] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (session?.role !== 'staff' || !scanning) return;

    const reader = new BrowserMultiFormatReader();
    let cancelled = false;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (cancelled || !result) return;
        if (err && !(err instanceof NotFoundException)) {
          console.error('Scan error:', err);
        }
        if (result) {
          handleScanned(result.getText());
        }
      })
      .then((controls) => {
        controlsRef.current = controls;
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus('error');
        setErrorMessage(
          err?.name === 'NotAllowedError'
            ? 'Akses kamera ditolak. Izinkan akses kamera di browser untuk pakai fitur scan.'
            : `Tidak bisa membuka kamera: ${err.message || err}`
        );
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.role, scanning]);

  async function handleScanned(isbn) {
    setScanning(false);
    controlsRef.current?.stop();
    setScannedIsbn(isbn);
    await doLookup(isbn);
  }

  async function doLookup(isbn) {
    setStatus('looking-up');
    setErrorMessage('');
    try {
      const result = await lookupBookByIsbn(isbn);
      if (result) {
        setBook(result);
        setStatus('found');
      } else {
        setBook(null);
        setStatus('not-found');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage(`Gagal mencari metadata: ${err.message || err}`);
    }
  }

  function handleScanAgain() {
    setScannedIsbn('');
    setBook(null);
    setManualIsbn('');
    setStatus('idle');
    setScanning(true);
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    const clean = manualIsbn.trim();
    if (!clean) return;
    handleScanned(clean);
  }

  if (session?.role !== 'staff') {
    return (
      <div className="page">
        <p>Fitur ini khusus untuk pustakawan.</p>
        <button className="button" type="button" onClick={() => navigate('/dashboard')}>
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="dashboard-header">
        <h1>Scan ISBN</h1>
        <button className="button secondary" type="button" onClick={() => navigate('/dashboard')}>
          Kembali
        </button>
      </header>

      {scanning && (
        <div className="scan-area">
          <video ref={videoRef} className="scan-video" muted playsInline />
          <p className="placeholder-note">Arahkan kamera ke barcode ISBN di sampul belakang buku.</p>
          <form onSubmit={handleManualSubmit} className="manual-isbn-form">
            <input
              type="text"
              inputMode="numeric"
              placeholder="atau ketik ISBN manual"
              value={manualIsbn}
              onChange={(e) => setManualIsbn(e.target.value)}
            />
            <button className="button" type="submit">
              Cari
            </button>
          </form>
        </div>
      )}

      {status === 'looking-up' && <p>Mencari data buku untuk ISBN {scannedIsbn}...</p>}

      {status === 'error' && (
        <div>
          <p className="error">{errorMessage}</p>
          <button className="button" type="button" onClick={handleScanAgain}>
            Coba lagi
          </button>
        </div>
      )}

      {status === 'not-found' && (
        <div>
          <p>
            ISBN <strong>{scannedIsbn}</strong> tidak ditemukan di Google Books maupun Open Library.
            Kemungkinan buku terbitan lokal/kecil — silakan input manual di SLiMS seperti biasa.
          </p>
          <button className="button" type="button" onClick={handleScanAgain}>
            Scan buku lain
          </button>
        </div>
      )}

      {status === 'found' && book && (
        <div className="book-result">
          <p className="placeholder-note">Sumber data: {book.source}. Periksa dulu sebelum dipakai.</p>
          {book.coverUrl && <img src={book.coverUrl} alt={book.title} className="book-cover" />}
          <dl className="book-fields">
            <dt>ISBN</dt>
            <dd>{book.isbn}</dd>
            <dt>Judul</dt>
            <dd>{book.title || '(tidak ada data)'}</dd>
            <dt>Pengarang</dt>
            <dd>{book.authors.length ? book.authors.join(', ') : '(tidak ada data)'}</dd>
            <dt>Penerbit</dt>
            <dd>{book.publisher || '(tidak ada data)'}</dd>
            <dt>Tahun Terbit</dt>
            <dd>{book.publishedDate || '(tidak ada data)'}</dd>
            {book.pageCount && (
              <>
                <dt>Jumlah Halaman</dt>
                <dd>{book.pageCount}</dd>
              </>
            )}
          </dl>
          <p className="placeholder-note">
            Salin data di atas ke form "Tambah Bibliografi" di SLiMS untuk sekarang. Simpan otomatis ke
            katalog akan ditambahkan di iterasi berikutnya.
          </p>
          <button className="button" type="button" onClick={handleScanAgain}>
            Scan buku lain
          </button>
        </div>
      )}
    </div>
  );
}
