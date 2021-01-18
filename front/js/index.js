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
        const blueDonut = document.querySelector('.moving-donut');
        const smile1 = document.querySelector('.moving-smile-1');
        const whoText = document.querySelector('.who-text');

        whoTitleElem.style.color = "black";
        whoTitleElem.textContent = newValue;
        blueDonut.style.display = "inherit";
        smile1.style.display = "inherit";
        if (id === 'alone') {
            whoText.style.display = "none";
        } else {
            whoText.style.display = "inherit";
        }
    } else {
        const howTitleElem = document.querySelector('.how-dropdown .how-title');
        const smile2 = document.querySelector('.moving-smile-2');
        const pinkStar1 = document.querySelector('.pink-star-1');

        howTitleElem.style.color = "black";
        howTitleElem.textContent = newValue;
        smile2.style.display = "inherit";
        pinkStar1.style.display = "inherit";
    }
    //커스텀 이벤트 트리거
    document.querySelector('.who-dropdown .who-title').dispatchEvent(new Event('change'));
    document.querySelector('.how-dropdown .how-title').dispatchEvent(new Event('change'));
}

function activateWhenAnimation() {
    const pinkStar2 = document.querySelector('.pink-star-2');
    const smile3 = document.querySelector('.moving-smile-3');

    pinkStar2.style.display = "inherit";
    smile3.style.display = "inherit";
}

function activateWhereAnimation() {
    const greenArrow = document.querySelector('.green-arrow');
    const smile4 = document.querySelector('.moving-smile-4');

    greenArrow.style.display = "inherit";
    smile4.style.display = "inherit";
}

(function () {
    //who
    const whoDropdownTitle = document.querySelector('.who-dropdown .who-title');
    const whoDropdownOptions = document.querySelectorAll('.who-dropdown .who-option');
    //how
    const howDropdownTitle = document.querySelector('.how-dropdown .how-title');
    const howDropdownOptions = document.querySelectorAll('.how-dropdown .how-option');
    //when
    const whenDropdownTitle = document.querySelector('.when-dropdown .when-title');

    //who 이벤트리스너
    whoDropdownTitle.addEventListener('click', toggleMenuDisplay);
    whoDropdownOptions.forEach(option => option.addEventListener('click', handleOptionSelected));

    //how 이벤트리스너
    howDropdownTitle.addEventListener('click', toggleMenuDisplay);
    howDropdownOptions.forEach(option => option.addEventListener('click', handleOptionSelected));

    // 캘린더 라이브러리
    flatpickr('#calendar-tomorrow', {
        "minDate": new Date().fp_incr(1)
    });

}());
