import csv
import sys

csv.field_size_limit(sys.maxsize)

def main():
	data = []
	with open('stage3-savedNodes.csv', 'rb') as csvfile:
		dataReader = csv.reader(csvfile, delimiter=',', quotechar='"')
		for row in dataReader:
			data.append(row)
	print "****************"
	print data[0][4]
main()