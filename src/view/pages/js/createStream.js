const $ = (select) => document.querySelector(select);

const getValuesFromForm = () => {
  const streamName = $("#streamName").value;
  const streamPassword = $("#streamPassword").value;
  return {
    streamName: streamName,
    streamPassword: streamPassword,
    // connectEmail: connectEmail,
  };
};

$("form").addEventListener("submit", async (event) => {
  event.preventDefault();
  await fetch("/createStream", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(getValuesFromForm()),
  });
});
