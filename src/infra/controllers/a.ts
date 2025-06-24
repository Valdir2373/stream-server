async function name() {
  const allStreams = await fetch(
    "https://stream-server-vava.onrender.com/deleteStream",
    {
      method: "DELETE",
    }
  );
}
