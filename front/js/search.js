const speech_bubble = document.getElementById("speech_bubble");
let clicked_items = [];

function showSpeechBubble() {
    speech_bubble.style.visibility = "visible";
}

function hideSpeechBubble() {
    speech_bubble.style.visibility = "hidden";
}

function addRemoveFunctionToBtn() {
    let total = document.getElementById("total");
    let eventEl = $(event.target).closest("#selected-item");
    const placeName = eventEl.text();
    eventEl.remove();
    // 삭제하려고 선택한 객체(버튼의 부모)를 삭제하고, 클릭된 요소들 배열에서도 뺀다. 총 몇 곳인지 업데이트한다.
    for (let item in clicked_items) {
        if (placeName == clicked_items[item].name) {
            let remove_index = clicked_items.indexOf(clicked_items[item]);
            clicked_items.splice(remove_index, 1);
            total.innerHTML = '총 ' + clicked_items.length + ' 곳';
        }
        if (clicked_items.length == 0) {
            total.parentNode.removeChild(total);
        }
    }
}

// API 연결
$("#searchKeyword").keydown(function (key) {
    if (key.keyCode == 13) {
        let searchKeyword = $('#searchKeyword').val();
        $.ajax({
            method: "GET",
            url: "https://apis.openapi.sk.com/tmap/pois?version=1&format=json&callback=result",
            async: false,
            data: {
                "appKey": "발급받은 키",
                "searchKeyword": searchKeyword,
                "resCoordType": "EPSG3857",
                "reqCoordType": "WGS84GEO",
                "count": 10
            },
            success: function (response) {
                let resultpoisData = response.searchPoiInfo.pois.poi;
                for (let k in resultpoisData) {
                    // 위도, 경도, 이름 받아온다.
                    let noorLat = Number(resultpoisData[k].noorLat);
                    let noorLon = Number(resultpoisData[k].noorLon);
                    let name = resultpoisData[k].name;

                    let pointCng = new Tmapv2.Point(noorLon, noorLat);
                    let projectionCng = new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(pointCng);

                    let lat = projectionCng._lat;
                    let lon = projectionCng._lng;

                    const search_result = document.getElementById('search-result');
                    let search_item_li = document.createElement('li');
                    let search_item = document.createElement('div');
                    let search_name = document.createElement('div');
                    let search_lat = document.createElement('div');
                    let search_lng = document.createElement('div');
                    search_item_li.id = 'search-item-li';
                    search_item.id = 'search-item';
                    search_name.id = 'search-name';
                    search_lat.id = 'search-lat';
                    search_lng.id = 'search-lng';

                    search_result.appendChild(search_item_li);
                    search_item_li.appendChild(search_item);
                    search_item.appendChild(search_name);
                    search_item.appendChild(search_lat);
                    search_item.appendChild(search_lng);
                    search_name.innerHTML = name;
                    search_lat.innerHTML = ',' + lat;
                    search_lng.innerHTML = ',' + lon;
                }
            }
        })
    }
});


// jquery에서는 동적으로 생성된 객체에 이벤트 걸 때 이렇게 한다.
$(document).on("click", "#search-item", function () {
    // 클릭한 객체의 이름, lat, lon 받아오기 
    // 이름은 총 ㅁ곳, ㅇㅇ에 출력하게 두고
    // lat, lon 배열에 list로 담기

    let search_item_li = $(this).text(); // html 텍스트를 한번에 받는다.
    let search_item_info = {
        name: '',
        lat: 0,
        lon: 0,
    }
    // 임시 배열에 ,로 나눈 값을 담는다.
    let temp = [];
    temp.push(search_item_li.split(','));
    search_item_info.name = temp[0][0];
    search_item_info.lat = Number(temp[0][1]);
    search_item_info.lon = Number(temp[0][2]);
    clicked_items.push(search_item_info);

    // html 구조 및 관계를 만들어준다.
    let total_sum = clicked_items.length;
    let selected_places = document.getElementById('selected-places');

    if (total_sum > 1) {
        let selected_items = document.getElementById('selected-items');
        let total = document.getElementById('total');
        total.innerHTML = '총 ' + total_sum + ' 곳';
        selected_items.innerHTML += "<div id='selected-item'>"
            + search_item_info.name + "<button id='btn-remove' alt='추가했던 장소 삭제 버튼'><img src='src/btn_mini_x.png' id='btn_mini_x' alt='' onclick='addRemoveFunctionToBtn()' /></button></div>";
        return;
    }

    selected_places.innerHTML = "<div id='total'>총 " + total_sum + " 곳</div>"
        + "<div id='selected-items'><div id='selected-item'>"
        + search_item_info.name + "<button id='btn-remove' alt='추가했던 장소 삭제 버튼'><img src='src/btn_mini_x.png' id='btn_mini_x' alt='' onclick='addRemoveFunctionToBtn()' /></button></div>"

    console.log(clicked_items);

});

// 밖에 누르면 places-example 숨기게 한다.
$('html').click(function (e) {
    let search_result = $('#search-result');
    let search_item_length = search_result.children(); // 바로 아래 자식 노드들 반환.

    if (!$(e.target).hasClass("click-in")) {
        search_result.css('visibility', 'hidden');
    } else {
        search_result.css('visibility', 'inherit');
        if (search_item_length.length == 0) {
            search_result.css('height', '0rem');
        }
        for (let li in search_item_length) {
            $('#search-item-li').remove();
        }
    }
});