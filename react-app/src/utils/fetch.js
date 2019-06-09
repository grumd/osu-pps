import encoding from 'text-encoding';

let decoder = null;
if (typeof TextDecoder === 'undefined') {
  decoder = new encoding.TextDecoder('utf-8');
} else {
  decoder = new TextDecoder('utf-8');
}

export const fetchJson = async ({ url }) => {
  try {
    const response = await fetch(url);
    if (response.status >= 200 && response.status < 300) {
      const data = await response.json();
      return data;
    } else {
      throw Error('HTTP Status ' + response.status);
    }
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
};

export const fetchJsonPartial = async ({ url, onIntermediateDataReceived }) => {
  try {
    // Step 1: start the fetch and obtain a reader
    const response = await fetch(url);
    if (response.status < 200 || response.status >= 300) {
      throw Error('HTTP Status ' + response.status);
    }
    if (!response.body || !response.body.getReader) {
      // Weird IE case, doesn't support body and/or getReader
      const data = await response.json();
      return data;
    }
    const reader = response.body.getReader();

    // Step 3: read the data
    let previousReceivedLength = 0;
    let receivedLength = 0; // length at the moment
    const chunks = []; // array of received binary chunks (comprises the body)
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      chunks.push(value);
      receivedLength += value.length;

      if (
        onIntermediateDataReceived &&
        Math.floor(receivedLength / 1000000) !== Math.floor(previousReceivedLength / 1000000)
      ) {
        // Every 1MB we calculate intermediate JSON array with partial data
        const chunksAll = new Uint8Array(receivedLength);
        let position = 0;
        for (let chunk of chunks) {
          chunksAll.set(chunk, position);
          position += chunk.length;
        }
        const result = decoder.decode(chunksAll);
        const truncatedResult = result.slice(0, result.lastIndexOf('},')) + '}]';
        try {
          onIntermediateDataReceived(JSON.parse(truncatedResult));
        } catch (e) {
          console.error(e);
        }
      }

      previousReceivedLength = receivedLength;
    }

    // Step 4: concatenate chunks into single Uint8Array
    const chunksAll = new Uint8Array(receivedLength); // (4.1)
    let position = 0;
    for (let chunk of chunks) {
      chunksAll.set(chunk, position); // (4.2)
      position += chunk.length;
    }

    // Step 5: decode into a string
    const result = decoder.decode(chunksAll);

    // We're done!
    const data = JSON.parse(result);
    return data;
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
};
