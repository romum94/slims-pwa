// Lookup metadata buku dari ISBN. Coba Google Books dulu, fallback ke Open Library.
// Iterasi 1: tanpa cache lintas-tenant, langsung panggil API eksternal dari browser.

async function lookupGoogleBooks(isbn) {
  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}`);
  if (!res.ok) return null;
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;
  const info = item.volumeInfo || {};
  return {
    source: 'Google Books',
    isbn,
    title: info.title || '',
    authors: info.authors || [],
    publisher: info.publisher || '',
    publishedDate: info.publishedDate || '',
    pageCount: info.pageCount || null,
    coverUrl: info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '',
  };
}

async function lookupOpenLibrary(isbn) {
  const res = await fetch(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`
  );
  if (!res.ok) return null;
  const data = await res.json();
  const item = data[`ISBN:${isbn}`];
  if (!item) return null;
  return {
    source: 'Open Library',
    isbn,
    title: item.title || '',
    authors: (item.authors || []).map((a) => a.name),
    publisher: (item.publishers || [])[0]?.name || '',
    publishedDate: item.publish_date || '',
    pageCount: item.number_of_pages || null,
    coverUrl: item.cover?.medium || item.cover?.small || '',
  };
}

export async function lookupBookByIsbn(rawIsbn) {
  const isbn = rawIsbn.replace(/[^0-9Xx]/g, '');
  if (!isbn) {
    throw new Error('ISBN tidak valid.');
  }

  const fromGoogle = await lookupGoogleBooks(isbn).catch(() => null);
  if (fromGoogle && fromGoogle.title) return fromGoogle;

  const fromOpenLibrary = await lookupOpenLibrary(isbn).catch(() => null);
  if (fromOpenLibrary && fromOpenLibrary.title) return fromOpenLibrary;

  return null;
}
