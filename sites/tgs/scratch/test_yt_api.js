fetch("https://apis.davidcyril.name.ng/download/ytmp4?url=https%3A%2F%2Fyoutube.com%2Fwatch%3Fv%3DMwpMEbgC7DA")
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => console.error(err));
