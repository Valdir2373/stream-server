async function deleteAllStreams() {
  const allStreams: any[] = await fetch(
    "http://localhost:1090/getAllStreams/bbecc326-b6b1-4b85-a033-d953cc67d50f"
  ).then((r) => r.json());
  allStreams.forEach(async (stream) => {
    const idStream = stream.id;
    const a = await fetch(`http://localhost:1090/deleteStream/${idStream}`, {
      method: "DELETE",
    }).then((r) => r.json());
    console.log(a);
  });
}

deleteAllStreams();
