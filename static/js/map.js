var markerArr = [];
var infoWindow;

// var map = new kakao.maps.Map(container, options); //지도 생성 및 객체 리턴
var container = document.getElementById('map'); //지도를 담을 영역의 DOM 레퍼런스
// var options = {
// 	center: new Tmapv2.LatLng(37.570028, 126.986072),
// 	zoom : 12,
// 	zoomControl : true,
// 	scrollwheel : true
// };
// var map = new Tmapv2.Map(container, options);
var map;

// $("#placeul .placeitem #removebtn").click();	
let actualT = getActualTime();
setActualTime(actualT[0], actualT[1]);

// $('input[name=searchbox]').focus(function() {
// 	$("#searchres").show();
// 	// $(this).blur();
// 	// const resDiv = document.getElementById('searchres');
// });

$('input[name=searchbox]').click(function() {
	removeAllChilds();
	$("#searchres").toggle();
});

$('input[name=searchbox]').on("paste keyup click", function() {
	var keyword = $(this).val();

	$("#searchres").hide();

	if (keyword.replace(/^\s+|\s+$/g, "").length == 0) {
		removeAllChilds();
		return;
	}
	else {
		console.log('show_start: ' + keyword);
		$("#searchres").show();
	}

	$.ajax({
		method: "POST",
		url: "/api/search",
		async: true,
		data: {
			"searchKeyword" : keyword,
		},
		success: function(response) {
			let listEl = document.getElementById("searchul");
			removeAllChilds();
			
			try {
				var resultpoisData = response;
				let liFragment = document.createDocumentFragment();

				for (var k in resultpoisData) {
					let name = resultpoisData[k].name;
					console.log(resultpoisData[k].lat, resultpoisData[k].lng);
					var markerPosition = new Tmapv2.LatLng(resultpoisData[k].lat, resultpoisData[k].lng);

					let newEl = document.createElement("li");
					newEl.className = "serachitem";
					newEl.innerHTML = name;

					(function(map, name, markerPosition) {
						newEl.addEventListener("click", function() {
							container.innerHTML = '';

							map = new Tmapv2.Map(container, {
								center: markerPosition,
								zoom : 17,
								zoomControl : true,
								scrollwheel : true
							});

							var marker = new Tmapv2.Marker({
								position: markerPosition, //Marker의 중심좌표 설정.
								map: map //Marker가 표시될 Map 설정..
							});
							displayInfoWindow(map, name, markerPosition);
						});
					})(map, name, markerPosition);

					liFragment.appendChild(newEl);	
				}
				
				listEl.appendChild(liFragment);
			} catch {
				
			}

		},
		error:function(request,status,error){
			removeAllChilds();
			console.log("code:"+request.status+"\n"+"message:"+request.responseText+"\n"+"error:"+error);
		}
	});

});

$('#map').click(function() {
	$("#searchres").hide();
	$('input[name=searchbox]').blur();
});

$('input[name=visithour], input[name=visitmin]').each(function() {
	$(this).on("propertychange change keyup paste input", function() {
		let actualT = getActualTime();
		setActualTime(actualT[0], actualT[1]);
	});
});

$('input[name=starthour], input[name=startmin], input[name=endhour], input[name=endmin]').each(function() {
	$(this).on("propertychange change keyup paste input", function() {
		let possibleT = getPossibleTime();
		setPossibleTime(possibleT[0], possibleT[1]);
	});
});

function removeAllChilds() {
	let listEl = document.getElementById("searchul");

	while (listEl.hasChildNodes()) {
		listEl.removeChild(listEl.firstChild);
	}
}

function addRemoveEvent() {
	event.target.closest('li').remove();
	var listUl = document.getElementById('placeul');
	
	if (listUl.childElementCount == 0) {
		let el = document.createElement('li');		
		el.innerHTML = "<span>여행 장소를 선택해주세요.</span>";
		el.id = "emptyli";

		listUl.appendChild(el);

		setActualTime("00", "00");
	}
	else {
		$("#placeul li:nth-child(1)").find('.topborder').toggleClass('topborder').toggleClass('noborder');
		
		let totalH = 0, totalM = 0;
		$('input[name=visithour]').each(function() {
			totalH += Number($(this).val());
		});
		$('input[name=visitmin]').each(function() {
			totalM += Number($(this).val());
		});

		setActualTime(totalH, totalM);
	}

	removeMarker();

	var data = {};
	var listUl = document.getElementById('placeul');
	// console.log(listUl.childElementCount);
	let cnt = 0;

	const itemEls = listUl.getElementsByTagName("li");
	for (let el of itemEls) {
		const placeName = $($(el).children("div")).children("span").first().text();
		const lat = $($(el).children("div")).children("span:nth-child(2)").text();
		const lon = $($(el).children("div")).children("span:nth-child(3)").text();
		data[cnt] = {
			name: placeName,
			lat: lat,
			lon: lon
		}
		cnt++;
	}

	var positionBounds = new Tmapv2.LatLngBounds();		//맵에 결과물 확인 하기 위한 LatLngBounds객체 생성

	for (var k in data) {
		var markerPosition = new Tmapv2.LatLng(data[k].lat, data[k].lon);
		addMarker(data[k].name, markerPosition, positionBounds);
	}

	map.setZoom(5);
}

function addPlaceListFromSearch(name, lat, lon) {
	console.log(name, lat, lon);
	if (infoWindow) {
		infoWindow.setVisible(false);
	}

	let listEl = document.getElementById('placeul');
	let cnt = listEl.childElementCount;

	if (listEl.childElementCount >= 30) {
		alert("일정은 30개 이상 추가할 수 없습니다!");
		return;
	}
	
	let listFragment = document.createDocumentFragment();
	let newEl = document.createElement('li');

	if (listEl.firstElementChild.id == "emptyli") {
		listEl.firstElementChild.remove();
		newEl.innerHTML = "<span class='point'>•</span>"
					+ "<div class='iteminfo'>"
					+ 	"<span id='placename' class='placename noborder'>"+name+"</span>"
					+	"<span id='lat' style='display: none'>"+lat+"</span>"
					+	"<span id='lon' style='display: none'>"+lon+"</span>"
					+	"<div class='visitT noborder'>"
					+ 		"<input type='number' name='visithour' min='0' max='23' value='2'>"
					+       "<span style='padding: 0px 4px;'>시간</span>"
					+       "<input type='number' name='visitmin' min='0' max='59' value='0'>"
					+       "<span style='padding-left: 4px;'>분</span>"
					+	"</div>"
					+	"<span id='removebtn' class='removebtn noborder' onclick='addRemoveEvent()'>x</span>"
					+ "</div>";
	}
	else {
		newEl.innerHTML = "<span class='point'>•</span>"
					+ "<div class='iteminfo'>"
					+ 	"<span id='placename' class='placename topborder'>"+name+"</span>"
					+	"<span id='lat' style='display: none'>"+lat+"</span>"
					+	"<span id='lon' style='display: none'>"+lon+"</span>"
					+	"<div class='visitT topborder'>"
					+ 		"<input type='number' name='visithour' min='0' max='23' value='2'>"
					+       "<span style='padding: 0px 4px;'>시간</span>"
					+       "<input type='number' name='visitmin' min='0' max='59' value='0'>"
					+       "<span style='padding-left: 4px;'>분</span>"
					+	"</div>"
					+	"<span id='removebtn' class='removebtn topborder' onclick='addRemoveEvent()'>x</span>"
					+ "</div>";
	}
	newEl.className = "placeitem";

	const inputs = newEl.getElementsByTagName("input");
	for (let el of inputs) {
		$(el).on("propertychange change keyup paste input", function() {
			let actualT = getActualTime();
			setActualTime(actualT[0], actualT[1]);
		});
	}
	listFragment.appendChild(newEl);
	listEl.appendChild(listFragment);

	let actualT = getActualTime();
	setActualTime(actualT[0], actualT[1]);
}

function addPlaceListEvent() {
	let listEl = document.getElementById('placeul');
	let cnt = listEl.childElementCount;

	if (cnt >= 30) {
		alert("일정은 30개 이상 추가할 수 없습니다!");
		return;
	}

	let eventEl = $(event.target).closest('li');
	const placeName = $(eventEl.children("div")).children("span").first().text();
	const lat = $(eventEl.children("div")).children("span:nth-child(2)").text();
	const lon = $(eventEl.children("div")).children("span").last().text();

	console.log(placeName + lat + lon);
	eventEl.remove();
	
	let listFragment = document.createDocumentFragment();
	let newEl = document.createElement('li');

	if (listEl.firstElementChild.id == "emptyli") {
		listEl.firstElementChild.remove();
		newEl.innerHTML = "<span class='point'>•</span>"
					+ "<div class='iteminfo'>"
					+ 	"<span id='placename' class='placename noborder'>"+placeName+"</span>"
					+	"<span id='lat' style='display: none'>"+lat+"</span>"
					+	"<span id='lon' style='display: none'>"+lon+"</span>"
					+	"<div class='visitT noborder'>"
					+ 		"<input type='number' name='visithour' min='0' max='23' value='2'>"
					+       "<span style='padding: 0px 4px;'>시간</span>"
					+       "<input type='number' name='visitmin' min='0' max='59' value='0'>"
					+       "<span style='padding-left: 4px;'>분</span>"
					+	"</div>"
					+	"<span id='removebtn' class='removebtn noborder' onclick='addRemoveEvent()'>x</span>"
					+ "</div>";
	}
	else {
		newEl.innerHTML = "<span class='point'>•</span>"
					+ "<div class='iteminfo'>"
					+ 	"<span id='placename' class='placename topborder'>"+placeName+"</span>"
					+	"<span id='lat' style='display: none'>"+lat+"</span>"
					+	"<span id='lon' style='display: none'>"+lon+"</span>"
					+	"<div class='visitT topborder'>"
					+ 		"<input type='number' name='visithour' min='0' max='23' value='2'>"
					+       "<span style='padding: 0px 4px;'>시간</span>"
					+       "<input type='number' name='visitmin' min='0' max='59' value='0'>"
					+       "<span style='padding-left: 4px;'>분</span>"
					+	"</div>"
					+	"<span id='removebtn' class='removebtn topborder' onclick='addRemoveEvent()'>x</span>"
					+ "</div>";
	}
	newEl.className = "placeitem";

	const inputs = newEl.getElementsByTagName("input");
	for (let el of inputs) {
		$(el).on("propertychange change keyup paste input", function() {
			let actualT = getActualTime();
			setActualTime(actualT[0], actualT[1]);
		});
	}
	listFragment.appendChild(newEl);
	listEl.appendChild(listFragment);

	let actualT = getActualTime();
	setActualTime(actualT[0], actualT[1]);
}

// 일정목록 속 총 소요시간
function getActualTime() {
	let totalH = 0, totalM = 0;

	$('input[name=visithour]').each(function() {
		totalH += Number($(this).val());
	});
	$('input[name=visitmin]').each(function() {
		totalM += Number($(this).val());
	});
	
	return [totalH, totalM];
}

// 여행시간 상세설정 -> 총 소요시간 계산
function getPossibleTime() {
	let totalH = Number($('input[name=endhour]').val()) - Number($('input[name=starthour]').val());
	let totalM = Number($('input[name=endmin]').val()) - Number($('input[name=startmin]').val());
	
	return [totalH, totalM];
}

function setActualTime(hour, min) {
	$("#actualT").text("총 소요시간 " + hour + "시간 " + min + "분");
}

function setPossibleTime(hour, min) {
	$("#possibleT").text("총 소요시간 " + hour + "시간 " + min + "분");
}

function displayInfoWindow(map, name, markerPosition) {
	var content= "<div style='position: static; display: flex; font-size: 14px; border-radius: 10px; top: 410px; left : 800px; width : 250px; background: #FFFFFF 0% 0% no-repeat padding-box;'>"+
					"<div class='info-box' style='width: 100%; padding: 10px; position: relative; display: flex; justify-content: space-between; align-items: center;'>"+
						"<span class='tit' style='font-size: 16px; font-weight: bold;'>"+name+"</span>"+
						"<button style='cursor: pointer; outline: none; border: solid 1px #000000; padding: 7px 7px; text-align: center; font-size: 14px; background-color: #FFE13B' onclick=\"addPlaceListFromSearch('"+name+"',"+markerPosition.lat()+","+markerPosition.lng()+")\">"+
							"일정에 추가"+
						"</button>"+
					"</div>"+
				"</div>";
		if (infoWindow) {
			infoWindow.setVisible(false);
		}
		//Popup 객체 생성.
		infoWindow = new Tmapv2.InfoWindow({
			position: markerPosition, //Popup 이 표출될 맵 좌표
			border :'0px solid #FF0000', //Popup의 테두리 border 설정.
			content: content, //Popup 표시될 text
			type: 2, //Popup의 type 설정.
			map: map //Popup이 표시될 맵 객체
		});
}

function getRecPath() {
	var data = {};
	var listUl = document.getElementById('placeul');
	// console.log(listUl.childElementCount);
	let cnt = 0;

	const itemEls = listUl.getElementsByTagName("li");
	for (let el of itemEls) {
		const placeName = $($(el).children("div")).children("span").first().text();
		const lat = $($(el).children("div")).children("span:nth-child(2)").text();
		const lon = $($(el).children("div")).children("span:nth-child(3)").text();
		data[cnt] = {
			name: placeName,
			lat: lat,
			lon: lon
		}
		cnt++;
	}

    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: "/api/path",
        dataType: "json",
        data: JSON.stringify(data),
        success: function (response) {
			var positionBounds = new Tmapv2.LatLngBounds();		//맵에 결과물 확인 하기 위한 LatLngBounds객체 생성
			var path = [];

			for (var k in response['path']) {
				var markerPosition = new Tmapv2.LatLng(response['path'][k].lat, response['path'][k].lon);
				path.push(markerPosition);
				addMarker(response['path'][k].name, markerPosition, positionBounds);

			}

			var polyline = new Tmapv2.Polyline({
				path: path,
				strokeColor: "#dd00dd", // 라인 색상
				strokeWeight: 6, // 라인 두께
				strokeStyle: "solid", // 선의 종류
				map: map // 지도 객체
			});

			map.setZoom(8);
        },
        error: function (request, status, error) {
            console.log("error!!", error);
            // console.log("code:" + request.status + "\n" + "message:" + request.responseText + "\n" + "error:" + error);
        }
    })
}

function setShareIconFinish() {
	let div_shareBtn = document.getElementById('share');
	let shareBtn = document.getElementById('btn-share');
	shareBtn.className = 'share-after';
	div_shareBtn.classList.add('bounce');
}

function removeMarker() {
	// 기존 마커, 팝업 제거
	if(markerArr.length > 0){
		for(var i in markerArr){
			markerArr[i].setMap(null);
		}
	}
}

function addMarker(name, markerPosition, positionBounds) {
	marker = new Tmapv2.Marker({
		position : markerPosition,
		iconSize : new Tmapv2.Size(24, 38),
		title : name,
		map: map
	   });

	markerArr.push(marker);
	positionBounds.extend(markerPosition);	// LatLngBounds의 객체 확장
	
	map.panToBounds(positionBounds);	// 확장된 bounds의 중심으로 이동시키기
	map.setCenter(markerPosition);
	// map.panBy(80, 0);
	map.setZoom(19);
}

$("#completebtn").click(function () {
	setShareIconFinish();
	getRecPath();
})