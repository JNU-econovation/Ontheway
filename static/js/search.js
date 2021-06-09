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
    const placeName = eventEl.children("span").text();

    eventEl.remove();
    // 삭제하려고 선택한 객체(버튼의 부모)를 삭제하고, 클릭된 요소들 배열에서도 뺀다. 총 몇 곳인지 업데이트한다.
    for (let item in clicked_items) {
        if (placeName == clicked_items[item].name) {
            let remove_index = clicked_items.indexOf(clicked_items[item]);
            clicked_items.splice(remove_index, 1);
            // console.log(clicked_items);
            total.innerHTML = '총 ' + clicked_items.length + ' 곳';
        }
        if (clicked_items.length == 0) {
            // console.log(clicked_items);
            total.parentNode.removeChild(total);
        }
    }
}

$("#btn-start").click(function() {
    // console.log("clicked!!");
    var clickedData = {};

    for (var k in clicked_items) {
        clickedData[k] = clicked_items[k];
    }
    
    var jsonData = {
        "place": clickedData,
        "pos": {
            "province": $('#pos').text(),
            "lat": $('#lat').text(),
            "lon": $('#lon').text()
        }
    }

    console.log(jsonData);
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: "/map",
        dataType: "text",
        data: JSON.stringify(jsonData),
        success: function (response) {
            document.write(response);
            document.close();
        },
        error: function (request, status, error) {
            console.log(error);
            // console.log("code:" + request.status + "\n" + "message:" + request.responseText + "\n" + "error:" + error);
        }
    })
});

function removeList() {
  let listEl = document.getElementById("search-result");

  while (listEl.hasChildNodes()) {
    listEl.removeChild(listEl.firstChild);
  }
}

// API 연결
$("#searchKeyword").on("paste keyup click", function () {
    let searchKeyword = $(this).val();

    if (searchKeyword.replace(/^s+|\s+$/g, "").length == 0) {
      removeList();
      return;
    }

    $.ajax({
        method: "POST",
        url: "/api/search", //"https://apis.openapi.sk.com/tmap/pois?version=1&format=json&callback=result",
        async: false,
        data: {
            "searchKeyword": searchKeyword
        },
        success: function (response) {
            removeList();
            let resultpoisData = response;

            for (let k in resultpoisData) {
                // 위도, 경도, 이름 받아온다.
                let lat = Number(resultpoisData[k].lat);
                let lon = Number(resultpoisData[k].lng);
                let name = resultpoisData[k].name;

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
        },
        error:function(request, status, error) {
            removeList();
            console.log(error);
        }
    })
});

$("#logo").click(function() {
    console.log("clicked!")
    self.location = "http://13.125.11.77/"
})

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

        let selected_item = document.createElement('div');
        selected_item.innerHTML = "<span>"+search_item_info.name+"</span>"
                                +       "<button id='btn-remove' alt='추가했던 장소 삭제 버튼'  onclick='addRemoveFunctionToBtn()'>x</button>";
        selected_item.id = "selected-item";
        selected_items.appendChild(selected_item);
        // console.log(clicked_items);
        return;
    }
    selected_places.innerHTML = "<div id='total'>총 " + total_sum + " 곳</div>"
                              + "<div id='selected-items'>"
                              +   "<div id='selected-item'>"
                              +       "<span>"+search_item_info.name+"</span>"
                              +       "<button id='btn-remove' alt='추가했던 장소 삭제 버튼'  onclick='addRemoveFunctionToBtn()'>x</button>"
                              +   "</div></div>"

    // console.log(clicked_items);
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

    }
});
