//renders a list of tracks in the ui
export function renderTracks(tracks) {
  const tableHead = document.getElementById("table-head");
  const tableBody = document.getElementById("table-body");

  //clears html
  tableHead.innerHTML = "";
  tableBody.innerHTML = "";

  if (tracks.length === 0) return;

  //builds headers
  const headers = Object.keys(tracks[0]);
  const headRow = document.createElement("tr");
  headers.forEach(field => {
    const th = document.createElement("th");
    th.textContent = field;
    headRow.appendChild(th);
  });
  tableHead.appendChild(headRow);

  //builds tracks
  tracks.forEach(track => {
    const row = document.createElement("tr");
  
    //for each field add a td element
    headers.forEach(field => {
      const td = document.createElement("td");
      td.textContent = track[field];
      row.appendChild(td);
    });

    //add play button
    const playTd = document.createElement('td');
    const playButton = document.createElement('button');
    playButton.textContent = ">";
    playButton.dataset.youtubeId = track.youtube_id; //save id for click event

    playTd.appendChild(playButton);
    row.appendChild(playTd);

    tableBody.appendChild(row);
  });
}
