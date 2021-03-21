const locations = [];
const index_texts = ['첫번째 장소.', '두번째 장소.', '세번째 장소.', '네번째 장소.', '다섯번째 장소.', '여섯번째 장소.',
    '일곱번째 장소.', '여덟번째 장소.', '아홉번째 장소.', '열번째 장소.', '열한번째 장소.', '열두번째 장소.', '열세번째 장소.',
    '열네번째 장소.', '열다섯번째 장소.', '열여섯번째 장소.', '열일곱번째 장소.', '열여덟번째 장소.', '열아홉번째 장소.', '스무번째 장소.'];
const container = document.getElementById('locations-container');

// name, time, lat, lng 받아오기
// 위도, 경도로 지도 띄우기
locations.push({ name: '해성막창 엘시티점', time: '17:00 ~ 03:00', latitude: 37.566481622437934, longitude: 126.98502302169841 });
locations.push({ name: '다리집', time: '17:00 ~ 03:00', latitude: 37.566481622437934, longitude: 126.98502302169841 });

for (let idx in locations) {
    createLocaItem(idx);
}

// 버튼 클릭할 시 캡처한 내용 body에 붙혀보기
$('#btn-final').click((e) => {
    console.log($(e.target.parentElement.parentElement.parentElement).children("section"));
    html2canvas($("section")[0]).then(function (canvas) {
        if (navigator.msSaveBlob) {
            var blob = canvas.msToBlob();
            return navigator.msSaveBlob(blob, '파일명.jpg');

        } else {
            var el = document.getElementById("target");
            console.log(el);
            el.href = canvas.toDataURL("image/png");
            el.download = '파일명.png';
            el.click();
        }
    });
});

function createLocaItem(idx) {
    let loca_item = document.createElement('div');
    let loca_text = document.createElement('div');
    let loca_index = document.createElement('div');
    let blank_2 = document.createElement('div');
    let loca_name = document.createElement('div');
    let visit_time = document.createElement('div');
    let loca_time = document.createElement('div');
    let loca_blank = document.createElement('div');
    let loca_map = document.createElement('div');
    let map;
    let marker;

    // id, class 지정
    loca_item.id = 'location-item';
    loca_text.id = 'location-text';
    loca_index.id = 'location-index';
    blank_2.classList.add('blank_2');
    loca_name.id = 'location-name';
    visit_time.classList.add('visiting-time');
    loca_time.id = 'location-time';
    loca_blank.classList.add('location-blank');
    loca_map.classList.add('location-map');
    loca_map.id = 'location-map' + idx;

    // idx를 바탕으로 장소순서 지정
    if (idx <= index_texts.length) {
        loca_index.innerHTML = index_texts[idx];
    } else {
        loca_index.innerHTML = '그 다음 장소.';
    }

    loca_name.innerHTML = locations[idx].name;
    loca_time.innerHTML = locations[idx].time;
    visit_time.innerHTML = '머무는 시간';

    // html 관계설정
    container.appendChild(loca_item);
    loca_item.appendChild(loca_text);
    loca_item.appendChild(visit_time);
    loca_item.appendChild(loca_time);
    loca_item.appendChild(loca_blank);
    loca_item.appendChild(loca_map);
    loca_text.appendChild(loca_index);
    loca_text.appendChild(blank_2);
    loca_text.appendChild(loca_name);

    // map 생성
    // Tmapv2.Map을 이용하여, 지도가 들어갈 div, 넓이, 높이를 설정.
    map = new Tmapv2.Map("location-map" + idx, {
        center: new Tmapv2.LatLng(locations[idx].latitude, locations[idx].longitude),
        zoom: 16
    });

    // 마커 생성
    marker = new Tmapv2.Marker({
        position: new Tmapv2.LatLng(locations[idx].latitude, locations[idx].longitude),
        map: map
    });
}
