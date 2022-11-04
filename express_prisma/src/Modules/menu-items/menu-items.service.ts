import { MenuItem } from "@prisma/client";
import App from "../../app";

type ItemResult = MenuItem & {
    level?: number
    children?: ItemResult[]
}

const getItem = (items: MenuItem[], id: number): ItemResult => {
    return items.filter(item => item.id == id)[0]
}

const getLevel = (items: MenuItem[], item: MenuItem): number => {
    if (item.parentId) {
        return 1 + getLevel(items, getItem(items, item.parentId))
    }

    return 1
}


export class MenuItemsService {
  constructor(protected app: App) {}

  /* TODO: complete getMenuItems so that it returns a nested menu structure
    Requirements:
    - your code should result in EXACTLY one SQL query no matter the nesting level or the amount of menu items.
    - post process your results in javascript
    - it should work for infinite level of depth (children of childrens children of childrens children, ...)
    - verify your solution with `npm run test`
    - do a `git commit && git push` after you are done or when the time limit is over
    Hints:
    - open the `src/menu-items/menu-items.service.ts` file
    - partial or not working answers also get graded so make sure you commit what you have
    Sample response on GET /menu:
    ```json
    [
        {
            "id": 1,
            "name": "All events",
            "url": "/events",
            "parentId": null,
            "createdAt": "2021-04-27T15:35:15.000000Z",
            "children": [
                {
                    "id": 2,
                    "name": "Laracon",
                    "url": "/events/laracon",
                    "parentId": 1,
                    "createdAt": "2021-04-27T15:35:15.000000Z",
                    "children": [
                        {
                            "id": 3,
                            "name": "Illuminate your knowledge of the laravel code base",
                            "url": "/events/laracon/workshops/illuminate",
                            "parentId": 2,
                            "createdAt": "2021-04-27T15:35:15.000000Z",
                            "children": []
                        },
                        {
                            "id": 4,
                            "name": "The new Eloquent - load more with less",
                            "url": "/events/laracon/workshops/eloquent",
                            "parentId": 2,
                            "createdAt": "2021-04-27T15:35:15.000000Z",
                            "children": []
                        }
                    ]
                },
                {
                    "id": 5,
                    "name": "Reactcon",
                    "url": "/events/reactcon",
                    "parentId": 1,
                    "createdAt": "2021-04-27T15:35:15.000000Z",
                    "children": [
                        {
                            "id": 6,
                            "name": "#NoClass pure functional programming",
                            "url": "/events/reactcon/workshops/noclass",
                            "parentId": 5,
                            "createdAt": "2021-04-27T15:35:15.000000Z",
                            "children": []
                        },
                        {
                            "id": 7,
                            "name": "Navigating the function jungle",
                            "url": "/events/reactcon/workshops/jungle",
                            "parentId": 5,
                            "createdAt": "2021-04-27T15:35:15.000000Z",
                            "children": []
                        }
                    ]
                }
            ]
        }
    ]
  */

  getLevel(item: MenuItem): number {
    if (!item.parentId) {
        return 1
    } else {
        return 1 + this.getLevel(item)
    }
  }

  async getMenuItems() {
    const itemLevel: Record<string, number>[] = []
    const menuItems: ItemResult[] = await this.app.getDataSource().menuItem.findMany();

    for (let i = 0; i < menuItems.length; i++) {
        const menuItem = menuItems[i]
        itemLevel.push({
            id: menuItem.id,
            level: getLevel(menuItems, menuItem)
        })
    }

    itemLevel.sort((a, b) => (a.level > b.level ? -1 : 1)).forEach(item => {
        const menuItem = getItem(menuItems, item.id)
        const currentIndex: number = menuItems.findIndex(item => item.id === menuItem.id)

        if (menuItem.parentId) {
            const parentItem = getItem(menuItems, menuItem.parentId)
            const parentIndex = menuItems.findIndex(item => item.id === parentItem.id)


            if (menuItems[parentIndex].children == undefined) {
                menuItems[parentIndex].children = []
            }
            menuItems[parentIndex].children?.push(menuItem)
            menuItems.splice(currentIndex, 1)
        }
    })

    return menuItems
  }
}
