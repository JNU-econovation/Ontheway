let clicked_options = {};
clicked_options['who'] = '';
clicked_options['how'] = '';
clicked_options['when'] = '';
clicked_options['where'] = {};

function toggleClass(elem, className) {
    if (elem.className.indexOf(className) !== -1) { // 일치하는 값이 있으면
        elem.className = elem.className.replace(className, '');
    }
    else { // 일치하는 값이 없으면
        elem.className = elem.className.replace(/\s+/g, ' ') + ' ' + className;
    }
    return elem;
}

function toggleDisplay(elem) {
    const curDisplayStyle = elem.style.display;
    if (curDisplayStyle === 'none' || curDisplayStyle === '') {
        elem.style.display = 'block';
    }
    else {
        elem.style.display = 'none';
    }
}

function toggleMenuDisplay(e) {
    const dropdown = e.currentTarget.parentNode;
    if (dropdown.className == "who-dropdown") {
        const whoMenu = dropdown.querySelector('.who-menu');
        toggleClass(whoMenu, 'hide');
    } else {
        const howMenu = dropdown.querySelector('.how-menu');
        toggleClass(howMenu, 'hide');
    }
}

function handleOptionSelected(e) {
    toggleClass(e.target.parentNode, 'hide');

    const id = e.target.id;
    const newValue = e.target.textContent + ' ';
    // console.log(e.target.className);
    // console.log(id);
    if (e.target.className == 'who-option') {
        const whoTitleElem = document.querySelector('.who-dropdown .who-title');
        const whoText = document.querySelector('.who-text');

        whoTitleElem.style.color = "black";
        whoTitleElem.textContent = newValue;

        if (id === 'alone') {
            whoText.style.display = "none";
        } else {
            whoText.style.display = "inherit";
        }
        clicked_options['who'] = id;

        playVideo();
        // console.log(clicked_options);
    } else {
        const howTitleElem = document.querySelector('.how-dropdown .how-title');

        howTitleElem.style.color = "black";
        howTitleElem.textContent = newValue;
        clicked_options['how'] = id;

        playVideo();
        // console.log(clicked_options);
    }
    //커스텀 이벤트 트리거
    document.querySelector('.who-dropdown .who-title').dispatchEvent(new Event('change'));
    document.querySelector('.how-dropdown .how-title').dispatchEvent(new Event('change'));
}

function activateWhenAnimation() {
    const calendar_value_i = $("#calendar-tomorrow").val();
    clicked_options['when'] = calendar_value_i;
    playVideo();
    // console.log(clicked_options);
}

function removeList() {
    let listEl = document.getElementById("search-result");

    while (listEl.hasChildNodes()) {
        listEl.removeChild(listEl.firstChild);
    }
}

function playVideo() {
    let bgVideo = document.getElementById("interactive_video");
    let stopTime = new Array("3.2", "3.3", "6.3", "6.4", "9.1", "9.2", "11.0", "11.1");

    bgVideo.play();
    bgVideo.addEventListener("timeupdate", function () {
        // console.log(this.currentTime);
        if (stopTime.includes(this.currentTime.toFixed(1))) {
            bgVideo.pause();
        }
    })
}


$("#where-input").on("paste keyup click", function () {
    let searchKeyword = $(this).val();

    if (searchKeyword.replace(/^s+|\s+$/g, "").length == 0) {
        removeList();
        return;
    }

    $.ajax({
        method: "POST",
        url: "/api/area", //"https://apis.openapi.sk.com/tmap/pois?version=1&format=json&callback=result",
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
                search_item_li.id = 'search-item-li';
                search_item_li.innerHTML = "<div id='search-item'><div id='search-name'>"
                    + name + "</div><div id='search-latlng'><div id='search-lat'>,"
                    + lat + "</div><div id='search-lng'>,"
                    + lon + "</div></div></div>";

                let search_item = search_item_li.getElementsByTagName('div');
                for (item of search_item) {
                    $(item).on("click", function () {
                        document.getElementById('where-input').value = name;
                    });
                    break;
                }
                search_result.appendChild(search_item_li);
            }
        },
        error: function (request, status, error) {
            removeList();
            console.log(error);
        }
    })
});

$("#btn-start").click(function () {
    var jsonData = clicked_options['where'];
    console.log(Object.keys(jsonData).length);

    if (Object.keys(jsonData).length == 0) {
        alert('지역 정보는 추천에 꼭 필요해요!🙏🏻');
        return;
    }

    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: "/main",
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
    // $.ajax({
    //     type: "POST",
    //     url: "/main",
    //     async: false,
    //     data: {
    //         "option": clicked_options['where']
    //     },
    //     success: function (response) {
    //         document.write(response);
    //         document.close();
    //     },
    //     error: function (request, status, error) {
    //         console.log(error);
    //         // console.log("code:" + request.status + "\n" + "message:" + request.responseText + "\n" + "error:" + error);
    //     }
    // })
});


// API 연결
// $("#where-input").keydown(function (key) {
//     if (key.keyCode == 13) {
//         let searchKeyword = $('#where-input').val();
//         $.ajax({
//             method: "GET",
//             url: "https://apis.openapi.sk.com/tmap/pois?version=1&format=json&callback=result",
//             async: false,
//             data: {
//                 "appKey": "발급받은키",
//                 "searchKeyword": searchKeyword,
//                 "resCoordType": "EPSG3857",
//                 "reqCoordType": "WGS84GEO",
//                 "count": 5
//             },
//             success: function (response) {
//                 let resultpoisData = response.searchPoiInfo.pois.poi;
//                 for (let k in resultpoisData) {
//                     // 위도, 경도, 이름 받아온다.
//                     let noorLat = Number(resultpoisData[k].noorLat);
//                     let noorLon = Number(resultpoisData[k].noorLon);
//                     let name = resultpoisData[k].name;

//                     let pointCng = new Tmapv2.Point(noorLon, noorLat);
//                     let projectionCng = new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(pointCng);

//                     let lat = projectionCng._lat;
//                     let lon = projectionCng._lng;

//                     const search_result = document.getElementById('search-result');
//                     let search_item_li = document.createElement('li');
//                     search_item_li.id = 'search-item-li';
//                     search_item_li.innerHTML = "<div id='search-item'><div id='search-name'>"
//                         + name + "</div><div id='search-latlng'><div id='search-lat'>,"
//                         + lat + "</div><div id='search-lng'>,"
//                         + lon + "</div></div></div>"
//                     search_result.appendChild(search_item_li);
//                 }
//             }
//         })
//     }
// });

let clicked_location = [];
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

    // 지역은 한 개만 들어가 있도록 한다.
    if (clicked_location.length >= 1) {
        clicked_location.pop();
    }
    clicked_location.push(search_item_info);
    clicked_options['where'] = { 
        "province" : clicked_location[0].name,
        "lat" : clicked_location[0].lat,
        "lon" : clicked_location[0].lon
    };
    // console.log(clicked_options);
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

(function () {
    //who
    const whoDropdownTitle = document.querySelector('.who-dropdown .who-title');
    const whoDropdownOptions = document.querySelectorAll('.who-dropdown .who-option');
    //how
    const howDropdownTitle = document.querySelector('.how-dropdown .how-title');
    const howDropdownOptions = document.querySelectorAll('.how-dropdown .how-option');

    //who 이벤트리스너
    whoDropdownTitle.addEventListener('click', toggleMenuDisplay);
    whoDropdownOptions.forEach(option => option.addEventListener('click', handleOptionSelected));

    //how 이벤트리스너
    howDropdownTitle.addEventListener('click', toggleMenuDisplay);
    howDropdownOptions.forEach(option => option.addEventListener('click', handleOptionSelected));

    // 캘린더 라이브러리
    flatpickr('#calendar-tomorrow', {
        "minDate": new Date().fp_incr(1),
    });

}());