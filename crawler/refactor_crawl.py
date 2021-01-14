# -*- coding: utf-8 -*-
"""
Created on Wed Jan 13 22:50:36 2021

@author: 170544
"""
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
import time
import glob, os
import pandas as pd

class Crawl_tripadvisor():
    def __init__(self, url, options, path):
        self.url = url
        self.options = options
        self.driver = None
        self.driver_of_place = None
        self.path = path
        self.data = None
        self.columns = ['place','attr_list','address', 'uid','title','content','rating', 'likes', 'time', 'type']
        self.fname = ''

    def crawler(self):
        self.driver = webdriver.Chrome(options=self.options)
        self.driver.get(url)
        time.sleep(3)

        page = self.driver.find_elements_by_class_name('pageNum')
        end = int(page[-1].text)
        path = self.path

        for pageNum in range(2,end+2):
            places = self.driver.find_elements_by_class_name('_25PvF8uO')
            self.crawl_place(places)
            if pageNum == (end+1):
                break
            self.driver.find_element_by_xpath('//a[text()='+str(pageNum)+']').click()
            time.sleep(3)
        self.driver.close()

    def crawl_place(self, places):
        for place in places:
            place_name = place.find_element_by_tag_name('h2').text # 관광지 이름
            self.fname = path + '/'+place_name + '.json'

            if os.path.isfile(self.fname):
                continue

            link = place.find_element_by_tag_name('a').get_attribute('href')

            self.driver_of_place = webdriver.Chrome(options=self.options)
            self.driver_of_place.get(link)
            time.sleep(3)

            self.data = []
            self.crawl_reviews(place_name)

    def crawl_reviews(self, place_name):
        attr = self.driver_of_place.find_elements_by_class_name('_1cn4vjE4')
        attr_list = [x.text for x in attr] # 장소 속성

        address = self.driver_of_place.find_elements_by_class_name('LjCWTZdN') # 주소
        if len(address)!=0:
            address=address[0].text
        else:
            address=""

        reviews = self.driver_of_place.find_elements_by_class_name('Dq9MAugU')
        if self.non_section(reviews): # 리뷰가 없는 경우
            self.save_review()
            return 0

        review_page = self.driver_of_place.find_elements_by_class_name('pageNum')
        if self.non_section(review_page): # 리뷰페이지 번호가 없는 경우
            self.crawl_one_page_review(place_name, attr_list, address)
            self.save_review()
            return 0

        review_end = int(review_page[-1].text)
        for review_pageNum in range(2,review_end+2):
            if self.crawl_one_page_review(place_name, attr_list, address):
                break
            if review_pageNum == review_end+1:
                break
            self.driver_of_place.find_element_by_xpath('//a[text()='+str(review_pageNum)+']').click()

            time.sleep(1)
        self.save_review()


    def crawl_one_page_review(self, place_name, attr_list, address):
        reviews = self.driver_of_place.find_elements_by_class_name('Dq9MAugU')
        reviews[0].find_element_by_xpath('.//span[text()="더보기"]').click()
        if self.is_foreigner(reviews[0]):
            return True
        for review in reviews:
            if self.is_foreigner(review):
                return True
            data_one = self.consist_data_one(place_name, attr_list, address, review)
            self.print_review(data_one)
            self.data.append(data_one)
        return False

    def is_foreigner(self, review):
        return review.find_element_by_tag_name('span').text == '이 리뷰는 영문에서 기계 번역되었습니다. 기계 번역을 보시겠습니까?'

    def consist_data_one(self, place_name, attr_list, address, review):
        data_one = [place_name, attr_list, address]
        data_one += self.crawl_review(review)
        return data_one

    def non_section(self, reviews):
        return True if len(reviews)==0 else False

    def save_review(self):
        df = pd.DataFrame(self.data)
        if len(df)!=0:
            df.columns = self.columns
        df.to_json(self.fname)
        self.driver_of_place.close()

    def crawl_review(self, review):
        name = review.find_element_by_tag_name('a').get_attribute('href').split('/')[-1] # 사용자 이름
        rating = review.find_element_by_xpath('.//div[@data-test-target="review-rating"]/span').get_attribute('class').split('_')[-1] # 평가
        post_title = review.find_element_by_xpath('.//div[@data-test-target="review-title"]//span/span').text # 리뷰 제목
        post_content = review.find_element_by_tag_name('q').text # 리뷰 내용
        likes = review.find_elements_by_class_name('_3kbymg8R') # 좋아요
        pair_type = review.find_elements_by_xpath('.//span[@class="trip_type_label"]/..') # 동반자
        if len(pair_type)!=0:
            pair_type = pair_type[0].text.split(':')[1].strip()
        else:
            pair_type == ""

        if len(likes)==0:
            likes = 0
        else:
            likes = likes[0].text.split('개')[0]
        #time = review.find_element_by_xpath('.//span[@class="_355y0nZn"]/..').text.split(':')[1].strip() # 시간
        time = ' '.join(review.find_element_by_class_name('_2fxQ4TOx').text.split(' ')[-2:])

        data = [name, post_title, post_content, rating, likes, time, pair_type]
        return data

    def print_review(self,data):
        print(f"장소 : {data[0]} | 장소_속성 : {data[1]} | 장소_주소 : {data[2]} | 이름 : {data[3]} | 제목 : {data[4]}")
        print(f"평점 : {data[6]} | 좋아요 : {data[7]} | 날짜 : {data[8]} | 유형 : {data[9]}")
        print(data[5]) # content
        print()

if __name__ == '__main__':
    url = "https://www.tripadvisor.co.kr/Attractions-g294196-Activities-South_Korea.html"
    path = './data'
    if not os.path.exists(path):
        os.makedirs(path)
    options = webdriver.ChromeOptions()
    options.add_argument('headless')
    options.add_argument('window-size=1920x1080')
    options.add_argument("disable-gpu")
while(1):
    try:
        trip_adv = Crawl_tripadvisor(url, options, path)
        trip_adv.crawler()
    except:
        continue
