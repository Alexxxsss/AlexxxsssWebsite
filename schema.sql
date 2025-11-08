-- schema.sql
DROP TABLE IF EXISTS all_people;
DROP TABLE IF EXISTS people_left;

CREATE TABLE all_people (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE people_left (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);