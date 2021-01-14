# -*- coding: utf-8 -*-
"""
Created on Sun Nov 15 07:52:54 2020

@author: 170544
"""


from selenium import webdriver
from selenium.webdriver.common.keys import Keys
import time
import glob, os
import pandas as pd

def crawl_review(review):
    name = review.find_element_by_tag_name('a').get_attribute('href').split('/')[-1] # 사용자 이름
    rating = review.find_element_by_xpath('.//div[@data-test-target="review-rating"]/span').get_attribute('class').split('_')[-1] # 평가
    post_title = review.find_element_by_xpath('.//div[@data-test-target="review-title"]//span/span').text # 리뷰 제목
    post_content = review.find_element_by_tag_name('q').text # 리뷰 내용
    likes = review.find_elements_by_class_name('_3kbymg8R') # 좋아요
    if len(likes)==0:
        likes = 0
    else:
        likes = likes[0].text.split('개')[0]
    time = ' '.join(review.find_element_by_class_name('_2fxQ4TOx').text.split(' ')[-2:]) # 시간

    data = [name, post_title, post_content, rating, likes, time]
    return data

def print_review(data):
    print(f"번호 : {data[0]} | 장소 : {data[1]} | 이름 : {data[2]} | 제목 : {data[3]}")
    print(f"평점 : {data[5]} | 좋아요 : {data[6]} | 날짜 : {data[7]}")
    print(data[4])
    print()



def crawl_tripadvisor():
    '''
    url = "https://www.tripadvisor.co.kr"
    driver = webdriver.Chrome()
    driver.get(url)
    time.sleep(3)

    driver.find_element_by_class_name('R1IsnpX3').click()

    search = driver.find_element_by_xpath('//*[@type="search"]')
    search.send_keys('대한민국')
    search.send_keys(Keys.ENTER)

    time.sleep(5)
    korea = driver.find_element_by_class_name('location-meta-block')
    korea.click()

    time.sleep(3)
    tour = driver.find_element_by_xpath('//*[@title="즐길거리"]')
    tour.click()
    '''
    options = webdriver.ChromeOptions()
    options.add_argument('headless')
    options.add_argument('window-size=1920x1080')
    options.add_argument("disable-gpu")

    url = "https://www.tripadvisor.co.kr/Attractions-g294196-Activities-South_Korea.html"
    driver = webdriver.Chrome(options=options)
    driver.get(url)
    time.sleep(3)

    page = driver.find_elements_by_class_name('pageNum')
    end = int(page[-1].text)
    cnt = 0
    path = './data'
    def consist_data_l(cnt,place_name):
        data_l = [cnt, place_name]
        data_l += crawl_review(review)
        return data_l

    for pageNum in range(2,end+2):
        places = driver.find_elements_by_class_name('_25PvF8uO')
        for place in places:
            place_name = place.find_element_by_tag_name('h2').text # 관광지 이름
            fname = path + '/'+place_name + '.json'
            if os.path.isfile(fname):
                continue

            link = place.find_element_by_tag_name('a').get_attribute('href')

            driver2 = webdriver.Chrome(options=options)
            driver2.get(link)
            time.sleep(3)

            data = []
            columns = ['id','place','uid','title','content','rating', 'likes', 'time']

            reviews = driver2.find_elements_by_class_name('Dq9MAugU')
            if len(reviews)==0: #리뷰가 없는 경우
                df = pd.DataFrame(data)
                df.to_json(fname)
                driver2.close()
                continue
            review_page = driver2.find_elements_by_class_name('pageNum')
            if len(review_page)==0: # 리뷰페이지 번호가 없는 경우
                reviews = driver2.find_elements_by_class_name('Dq9MAugU')
                reviews[0].find_element_by_xpath('.//span[text()="더보기"]').click()
                for review in reviews:
                    if review.find_element_by_tag_name('span').text == '이 리뷰는 영문에서 기계 번역되었습니다. 기계 번역을 보시겠습니까?':
                        break
                    cnt+=1
                    data_l = consist_data_l(cnt, place_name)
                    print_review(data_l)
                    data.append(data_l)

                df = pd.DataFrame(data)
                if len(df)!=0:
                    df.columns = columns
                df.to_json(fname)
                driver2.close()
                continue

            review_end = int(review_page[-1].text)
            for review_pageNum in range(2,review_end+2): # 모든 리뷰 페이지 탐색
                reviews = driver2.find_elements_by_class_name('Dq9MAugU')
                reviews[0].find_element_by_xpath('.//span[text()="더보기"]').click()
                if reviews[0].find_element_by_tag_name('span').text == '이 리뷰는 영문에서 기계 번역되었습니다. 기계 번역을 보시겠습니까?':
                    break
                for review in reviews:
                    if review.find_element_by_tag_name('span').text == '이 리뷰는 영문에서 기계 번역되었습니다. 기계 번역을 보시겠습니까?':
                        break
                    cnt+=1
                    data_l = consist_data_l(cnt, place_name)
                    print_review(data_l)
                    data.append(data_l)


                if review_pageNum == review_end+1:
                    break
                driver2.find_element_by_xpath('//a[text()='+str(review_pageNum)+']').click()
                time.sleep(1)

            df = pd.DataFrame(data)
            if len(df)!=0:
                df.columns = columns
            df.to_json(fname)

            driver2.close()
        if pageNum == (end+1):
            break
        driver.find_element_by_xpath('//a[text()='+str(pageNum)+']').click()
        time.sleep(3)

    driver.close
'''
while(1):
    try:
        crawl_tripadvisor()
    except:
        continue
'''
crawl_tripadvisor()
