postgres:
	docker run --name postgres -p 5432:5432 -e POSTGRES_USER=root -e POSTGRES_PASSWORD=root -d postgres

createdb:
	docker exec -it postgres createdb --username=root cognydb