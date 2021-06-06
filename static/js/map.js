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
var provincePosition;

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
					var positionBounds = new Tmapv2.LatLngBounds();
					let newEl = document.createElement("li");
					newEl.className = "serachitem";
					newEl.innerHTML = name;

					(function(map, name, markerPosition, positionBounds) {
						newEl.addEventListener("click", function() {
							container.innerHTML = '';

							map = new Tmapv2.Map(container, {
								center: markerPosition,
								zoom : 17,
								zoomControl : true,
								scrollwheel : true
							});
							
							addMarker(map, name, markerPosition, positionBounds, 1);
							
							displayInfoWindow(map, name, markerPosition);
						});
					})(map, name, markerPosition, positionBounds);

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
		addMarker(map, data[k].name, markerPosition, positionBounds);
	}

	map.setCenter(new Tmapv2.LatLng(data[0].lat, data[0].lon));
}

function addPlaceListFromSearch(name, lat, lon) {
	console.log(name, lat, lon);
	if (infoWindow) {
		infoWindow.setVisible(false);
	}
	var at = $('#province-lat').text();
	var on = $('#province-lon').text();

	provincePosition = new Tmapv2.LatLng(at, on);
	container.innerHTML = '';

	map = new Tmapv2.Map(container, {
		center: provincePosition,
		zoom : 10,
		zoomControl : true,
		scrollwheel : true
	});

	let listEl = document.getElementById('placeul');
	const itemEls = listEl.getElementsByTagName("li");

	if (listEl.childElementCount >= 30) {
		alert("일정은 30개 이상 추가할 수 없습니다!");
		return;
	}

	for (let el of itemEls) {
		const elPlaceName = $($(el).children("div")).children("span").first().text();

		if (name == elPlaceName) {
			alert('같은 장소를 중복해서 추가할 수 없어요! 😅');
			return;
		}
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
	const itemEls = listEl.getElementsByTagName("li");
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

	for (let el of itemEls) {
		const elPlaceName = $($(el).children("div")).children("span").first().text();

		if (placeName == elPlaceName) {
			alert('같은 장소를 중복해서 추가할 수 없어요! 😅');
			return;
		}
	}

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
					var res = response['path']

					console.log(res);

					container.innerHTML = '';
					
					map = new Tmapv2.Map(container, {
						center: new Tmapv2.LatLng(res[0].lat, res[0].lon),
						zoom : 11,
						zoomControl : true,
						scrollwheel : true
					});

					for (var k in res) {
						if (k == Object.keys(res).length - 1) break;
						
						var markerPosition = new Tmapv2.LatLng(res[k].lat, res[k].lon);
						path.push(markerPosition);

						if (k == 0) {
							addMarker(map, res[k].name, markerPosition, positionBounds, 2);
						}
						else {
							addMarker(map, res[k].name, markerPosition, positionBounds);
						}
					}
					
					console.log(map);

					var polyline = new Tmapv2.Polyline({
						path: path,
						strokeColor: "#18A0FB", // 라인 색상
						strokeWeight: 6, // 라인 두께
						strokeStyle: "solid", // 선의 종류
						map: map // 지도 객체
					});
					
					map.panToBounds(positionBounds);	// 확장된 bounds의 중심으로 이동시키기

					// $("#share").click(function() {

					// 	$.ajax({
					// 			type: "POST",
					// 			contentType: "application/json",
					// 			url: "/result",
					// 			dataType: "json",
					// 			data: JSON.stringify(data),
					// 			success: function (response) {
					// 				// document.write(response);
					// 				console.log(response);
					// 			},
					// 			error: function (request, status, error) {
					// 					// console.log("error!!", error);
					// 					console.log("code:" + request.status + "\n" + "message:" + request.responseText + "\n" + "error:" + error);
					// 			}
					// 	});

					// });

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

function addMarker(map, name, markerPosition, positionBounds, option=0) {
	url = "https://ontheway.s3.ap-northeast-2.amazonaws.com/src/blue_pin.png";
	size = new Tmapv2.Size(24, 24);

	if (option == 1) {
		url = "https://ontheway.s3.ap-northeast-2.amazonaws.com/src/pin_orange.png";
		size = new Tmapv2.Size(28, 38)
	}
	if (option == 2) {
		url = "https://ontheway.s3.ap-northeast-2.amazonaws.com/src/pin_yellow_start.png";
		size = new Tmapv2.Size(30, 40)
	}

	marker = new Tmapv2.Marker({
		position : markerPosition,
		icon : url,
		iconSize : size,
		title : name,
		map: map
	});

	markerArr.push(marker);
	positionBounds.extend(markerPosition);	// LatLngBounds의 객체 확장

	map.panToBounds(positionBounds);	// 확장된 bounds의 중심으로 이동시키기
	map.setCenter(markerPosition);
	// map.panBy(80, 0);
}


$("#completebtn").click(function () {
	setShareIconFinish();
	getRecPath();
})

$(document).ready(function () {
	$(".loading").fadeOut();
});


// $(window).on("load", function () {
// 	$(".loading").fadeOut();
// });
