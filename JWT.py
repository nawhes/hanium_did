#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Thu Dec 12 14:20:06 2019

@author: babywalnut
"""

from flask import Flask, jsonify, request, make_response
import jwt
import datetime # It will be used when we expire someone's token
from functools import wraps
#Jsonify : return jason object
#Request : request income your class data blahblahblah
#make_response is something I can't understand

app = Flask(__name__)

app.config['SECRET_KEY'] ='thisisthesecretkey'


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.args.get('token') #http://127.0.0.1:5000/route?token=ajifjaljtalkjaklefjaklf2324242324re
        
        if not token:
            return jsonify({'message' : 'Token is missing' }),403
        
        try:
            date = jwt.decode(token, app.config['SECRET_KEY'])
        
        except:
            return jsonify({'message' : 'Token is invalid'}),403
            
        return f(*args,**kwargs)
    return decorated
@app.route('/unprotected') #not be protected any user can call it
def unprotected():
    return jsonify({'message' : 'Anyone can view this!'})

@app.route('/protected')# only for people who are authenticated, It means who pass a crack token
@token_required
def protected():
    return jsonify({'message' : 'This is only available with valid tokens.' })


@app.route('/login')#IT will be give you a token after you log in  
def login():
    auth = request.authorization
    
    if auth and auth.password =='password':
         token = jwt.encode({'user' : auth.username, 'exp' : datetime.datetime.utcnow() + datetime.timedelta(minutes=30)}, app.config['SECRET_KEY'])
         return jsonify({'token': token.decode('UTF-8')})
    return make_response('Could not verify!', 401, {'WWW-Authenticate' : 'Basic realm ="Login Required"'})

if __name__ =='__main__':
    app.run(debug=True)