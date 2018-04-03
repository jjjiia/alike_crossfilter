from functools import partial
import random
import pprint
import pylab
import csv
import math
import json
from math import radians, cos, sin, asin, sqrt
from shapely.geometry import *
from shapely.ops import cascaded_union
from operator import itemgetter
import time



def newFiltes():
    populationC = "SE_T002_001"
    with open("census_percent_2places_selected.csv","Ur")as infile:
    
        csvReader = csv.reader(infile) 
        with open("census_filtered_population_100.csv","a")as outfile:
            csvWriter = csv.writer(outfile)
        
         
            for row in csvReader:
                longHeaders = row
                hIndex = longHeaders.index(populationC)
                csvWriter.writerow(row)
            
                break

       
            
            #csvWriter.writerow([longHeaders[0],longHeaders[hIndex]])
            
            for row in csvReader:
                pop= int(row[hIndex])
                if pop>100:
                    csvWriter.writerow(row)
                #print row[0],row[hIndex]
                #print row[0],row[hIndex]
           
    
newFiltes()