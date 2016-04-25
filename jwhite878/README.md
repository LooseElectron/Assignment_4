Assignment 3 - The Historic Landmarks Server
README.md
Josh White

To my knowledge, all aspects of this assignment have been correctly implemented.

That is: 

- This assignment implements the "Historic Landmarks" server.

- A POST API has been created at the /sendLocation path, which returns a 
  JSON string  containing all checkins and landmarks, in the format described
  on the website. 
  This API also records  in the login, latitude, and longitude sent
  in the post request in a MongoDB, along with the timestamp. 
  If one of the parameters is missing, it sends an error message, 
  specified in the assignment, and does not insert the info into the databse.

- A GET API has been created at the /checkins path, which returns a JSON
  string containing all checkins for the specified login parameter. If no 
  login is given, returns an empty JSON object. 

- A GET API has been created at the root, which returns HTML representing
  a page which lists all checkins, with latitude, longitude, and timestamp
  in descending order. 

- My Assignment 2 in the master branch of my private Git repository has been
  updated to connect to the server created in this assignment. 

- No Application Errors result from use of this server. 


I discussed geolocation with Russell Gens, but all code is my own.

Approximately 10-15 hours were spent completing this assignment. 


Citations:

Haversine Formula JavaScript Algorithm: 
http://stackoverflow.com/questions/14560999/using-the-haversine-formula-in-javascript
