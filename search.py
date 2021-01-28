from flask import Flask, request, make_response, render_template, flash, redirect, url_for
import pandas as pd
import json

class Node:
    def __init__(self):
        self.next = {}
        self.depth = 0
        self.words = set()
        self.last = False

class WordTrie:
    def __init__(self, words):
        self.root = Node()
        for word in words:
            self.insert(word)

    def insert(self, word):
        n = self.root
        for w in word:
            if w not in n.next:
                n.next[w] = Node()
                n.next[w].depth = n.depth + 1
            n.words.add(word[n.depth:])
            n = n.next[w]
        n.last = True

class AutoComplete(WordTrie):
    def __init__(self, words, data):
        super().__init__(words)
        self.data = data

    def suggest(self, keyword):
        n = self.root
        for k in keyword:
            if k not in n.next: return []
            n = n.next[k]
        suggestions = []

        if n.last:
            pos = self.data[self.data.place == keyword]['pos'].squeeze()
            suggestions.append([keyword,pos])
        for word in n.words:
            query = keyword + word
            pos = self.data[self.data.place == query]['pos'].squeeze()
            if len(suggestions)< 10:
                suggestions.append([query,pos])
            else:
                break

        output = dict()
        for i in range(len(suggestions)):
            data_one = { 'name' : suggestions[i][0],
                         'lang' : suggestions[i][1][0],
                         'long' : suggestions[i][1][0],}
            output[i] = suggestions[i]

        return output

class Search():
    def __init__(self):
        self.data = pd.read_csv('db/data/pos_info.csv')
        self.places = self.data.place
        self.search = AutoComplete(self.places, self.data)

    def suggest(self, keyword):
        return self.search.suggest(keyword)
