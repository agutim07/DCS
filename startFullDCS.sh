#!/bin/bash

mate-terminal --tab --title="Backend tab" -e "bash -c 'cd backend && ./startDCS.sh'" &
mate-terminal --tab --title="Frontend tab" -e "bash -c 'cd frontend && npm start'" 



